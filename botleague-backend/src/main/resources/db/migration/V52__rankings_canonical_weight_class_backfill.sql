-- Companion to V51, for the column right next to the one it fixed.
--
-- EventSports.weight_class holds the catalog's own label ("60kg", "1.5kg")
-- while robots and the rankings filter use the legacy code shape ("60KG",
-- "1_5KG"), and the push wrote whichever the event sport happened to carry.
-- Two consequences, both live: a pool stored as "60kg" is invisible to a
-- filter asking for "60KG", and one real class stored under two spellings
-- ranks as two separate pools — a live pool list held ROBOSOCCER/5KG and
-- ROBOSOCCER/5kg side by side.
--
-- RankingEngineService now folds through WeightClassKeys.of() on the way in;
-- this folds what is already stored. Canonical form is the legacy code shape
-- (60 -> "60KG", 1.5 -> "1_5KG"), matching WEIGHT_CLASS_LABELS' keys and what
-- the frontend derives from a catalog weight.
--
-- A class with no number in it ("Open") has no code to fold to and is only
-- upper-cased; NULL and '' are left exactly as they are, so a sport with no
-- weight-class concept (Drone Soccer, RC by scale) stays one pool.
CREATE FUNCTION pg_temp.canonical_weight_class(raw text) RETURNS text AS $$
DECLARE m text[]; frac text;
BEGIN
    IF raw IS NULL THEN RETURN NULL; END IF;
    IF btrim(raw) = '' THEN RETURN btrim(raw); END IF;

    -- First number, with . _ or , as the decimal separator.
    m := regexp_match(btrim(raw), '(\d+)(?:[._,](\d+))?');
    IF m IS NULL THEN RETURN upper(btrim(raw)); END IF;

    IF m[2] IS NULL THEN RETURN m[1] || 'KG'; END IF;

    -- "1.50kg" is the 1.5 kg class; keeping the trailing zero would split it
    -- from "1_5KG".
    frac := regexp_replace(m[2], '0+$', '');
    IF frac = '' THEN RETURN m[1] || 'KG'; END IF;
    RETURN m[1] || '_' || frac || 'KG';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1. Folding can collide on uk_ranking_natural_key — that index is on
--    (robot_id, sport, COALESCE(weight_class,''), scope, season), and the
--    "5KG"/"5kg" pair above is exactly such a collision once both become
--    "5KG". Merge those groups into the lowest-id row first, same approach
--    V4 and V51 used.
WITH grouped AS (
    SELECT
        robot_id, sport,
        COALESCE(pg_temp.canonical_weight_class(weight_class), '') AS canon_wc,
        scope, season,
        MIN(id::text)::uuid AS keep_id,
        SUM(total_points)   AS sum_points,
        SUM(events_played)  AS sum_events,
        SUM(matches_played) AS sum_matches,
        SUM(wins)           AS sum_wins,
        SUM(losses)         AS sum_losses,
        SUM(gold_medals)    AS sum_gold,
        SUM(silver_medals)  AS sum_silver,
        SUM(bronze_medals)  AS sum_bronze
    FROM rankings
    WHERE robot_id IS NOT NULL
    GROUP BY robot_id, sport,
             COALESCE(pg_temp.canonical_weight_class(weight_class), ''),
             scope, season
    HAVING COUNT(*) > 1
)
UPDATE rankings r
SET total_points   = g.sum_points,
    events_played  = g.sum_events,
    matches_played = g.sum_matches,
    wins           = g.sum_wins,
    losses         = g.sum_losses,
    gold_medals    = g.sum_gold,
    silver_medals  = g.sum_silver,
    bronze_medals  = g.sum_bronze,
    win_percentage = CASE WHEN g.sum_matches > 0 THEN (g.sum_wins * 100.0 / g.sum_matches) ELSE 0 END
FROM grouped g
WHERE r.id = g.keep_id;

-- 2. Drop the rows just merged away.
DELETE FROM rankings r
USING (
    SELECT robot_id, sport,
           COALESCE(pg_temp.canonical_weight_class(weight_class), '') AS canon_wc,
           scope, season,
           MIN(id::text)::uuid AS keep_id
    FROM rankings
    WHERE robot_id IS NOT NULL
    GROUP BY robot_id, sport,
             COALESCE(pg_temp.canonical_weight_class(weight_class), ''),
             scope, season
    HAVING COUNT(*) > 1
) g
WHERE r.robot_id = g.robot_id
  AND r.sport = g.sport
  AND COALESCE(pg_temp.canonical_weight_class(r.weight_class), '') = g.canon_wc
  AND r.scope = g.scope
  AND r.season = g.season
  AND r.id <> g.keep_id;

-- 3. Fold what's left.
UPDATE rankings
SET weight_class = pg_temp.canonical_weight_class(weight_class)
WHERE weight_class IS DISTINCT FROM pg_temp.canonical_weight_class(weight_class);

-- 4. Same fold for the rank-change history, which the team/robot history
--    endpoints filter by weight class the same way. Append-only audit rows,
--    no natural-key index, so no merge step.
UPDATE global_ranking_history
SET weight_class = pg_temp.canonical_weight_class(weight_class)
WHERE weight_class IS DISTINCT FROM pg_temp.canonical_weight_class(weight_class);

DROP FUNCTION pg_temp.canonical_weight_class(text);
