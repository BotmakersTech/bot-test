-- RankingEngineService now folds EventSports.sport through SportKeys.of()
-- before writing a global ranking row, so a pool is keyed on one canonical
-- token ("ROBOWAR") whatever the event sport happened to be called ("Robo
-- War" from the catalog-driven Add Sport flow, "ROBO_WAR_OPEN" from before
-- it). Rows pushed BEFORE that change still carry the raw name, and the
-- rankings page — which now queries by the canonical key — can't see them:
-- the pool exists, holds real points, and no filter selection reaches it.
--
-- This folds the already-written rows the same way, so previously pushed
-- rankings become visible without anyone having to re-push. One-shot by
-- nature: every write path into these tables now canonicalises up front, so
-- nothing new can land here un-folded.
--
-- The CASE below mirrors SportKeys.of() including its ordering (the broad
-- "…SOCCER"/"…RACE" fallbacks last, so Drone Soccer isn't swallowed by Robo
-- Soccer nor RC Racing by Robo Race). It's a temporary function, dropped at
-- the end — this is a frozen one-time backfill, not a second live copy of
-- that rule to keep in sync.
CREATE FUNCTION pg_temp.canonical_sport_key(raw text) RETURNS text AS $$
DECLARE n text;
BEGIN
    IF raw IS NULL THEN RETURN NULL; END IF;
    n := upper(regexp_replace(raw, '[^A-Za-z0-9]+', '', 'g'));
    IF n = ''                    THEN RETURN n; END IF;
    IF n LIKE '%PLUGNPLAY%'      THEN RETURN 'PLUGNPLAY'; END IF;
    IF n LIKE '%THEMEBASED%'     THEN RETURN 'THEMEBASED'; END IF;
    IF n LIKE '%MANUALTASK%'     THEN RETURN 'MANUALTASK'; END IF;
    IF n LIKE '%AEROMODELLING%'  THEN RETURN 'AEROMODELLING'; END IF;
    IF n LIKE '%PROJECTBASED%'   THEN RETURN 'PROJECTBASED'; END IF;
    IF n LIKE '%ROBOWAR%' OR n LIKE '%ROBOTWAR%' OR n LIKE '%COMBAT%' THEN RETURN 'ROBOWAR'; END IF;
    IF n LIKE '%ROBOSUMO%' OR n LIKE '%SUMO%'    THEN RETURN 'ROBOSUMO'; END IF;
    IF n LIKE '%LINEFOLLOWER%' OR n LIKE '%LINEFOLLOW%' THEN RETURN 'LINEFOLLOWER'; END IF;
    IF n LIKE '%DRONESOCCER%' OR n LIKE '%DRONE%' THEN RETURN 'DRONESOCCER'; END IF;
    IF n LIKE '%RCRACING%' OR n LIKE '%RCROBO%' OR n LIKE '%RCCAR%' THEN RETURN 'RCRACINGCAR'; END IF;
    IF n LIKE '%ROBOSOCCER%' OR n LIKE '%SOCCER%' THEN RETURN 'ROBOSOCCER'; END IF;
    IF n LIKE '%ROBORACE%' OR n LIKE '%ROBORACING%' OR n LIKE '%RACE%' THEN RETURN 'ROBORACE'; END IF;
    RETURN n;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1. Two spellings of the same sport can already exist for one robot in the
--    same league/weight class (e.g. an old "ROBO_WAR_OPEN" row plus a newer
--    "Robo War" one). Folding both to ROBOWAR would collide on
--    uk_ranking_natural_key, so merge their stats into the lowest-id row
--    first — same approach V4 used when it introduced that index.
WITH grouped AS (
    SELECT
        robot_id,
        pg_temp.canonical_sport_key(sport) AS canon_sport,
        COALESCE(weight_class, '') AS wc, scope, season,
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
    GROUP BY robot_id, pg_temp.canonical_sport_key(sport), COALESCE(weight_class, ''), scope, season
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

-- 2. Drop the rows that just got merged away.
DELETE FROM rankings r
USING (
    SELECT robot_id, pg_temp.canonical_sport_key(sport) AS canon_sport,
           COALESCE(weight_class, '') AS wc, scope, season,
           MIN(id::text)::uuid AS keep_id
    FROM rankings
    WHERE robot_id IS NOT NULL
    GROUP BY robot_id, pg_temp.canonical_sport_key(sport), COALESCE(weight_class, ''), scope, season
    HAVING COUNT(*) > 1
) g
WHERE r.robot_id = g.robot_id
  AND pg_temp.canonical_sport_key(r.sport) = g.canon_sport
  AND COALESCE(r.weight_class, '') = g.wc
  AND r.scope = g.scope
  AND r.season = g.season
  AND r.id <> g.keep_id;

-- 3. Fold what's left.
UPDATE rankings
SET sport = pg_temp.canonical_sport_key(sport)
WHERE sport IS DISTINCT FROM pg_temp.canonical_sport_key(sport);

-- 4. Same fold for the rank-change history, which the team/robot history
--    endpoints filter by sport in exactly the same way. No natural-key index
--    here, so no merge step — these are append-only audit rows.
UPDATE global_ranking_history
SET sport = pg_temp.canonical_sport_key(sport)
WHERE sport IS DISTINCT FROM pg_temp.canonical_sport_key(sport);

DROP FUNCTION pg_temp.canonical_sport_key(text);
