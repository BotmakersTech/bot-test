-- B-10: no DB-level uniqueness ever backed the ranking-pool natural key
-- (robot_id, sport, weight_class, scope, season) that
-- findOrCreateGlobalRanking() relies on — two matches finalizing
-- concurrently could each fail to find an existing row and both insert a
-- new one, splitting that robot's points and medal counts across
-- duplicate rows. This must dedupe any such existing duplicates BEFORE
-- adding the constraint, or the ALTER below would simply fail against
-- data that already violates it.
--
-- Scope: robot_id IS NOT NULL only — USER-scope rows (robot_id is null by
-- design, see Ranking's class doc) aren't part of this natural key and a
-- plain unique index naturally exempts NULL from collision anyway.

-- 1. Merge duplicate groups' stats into the lowest-id row in each group.
WITH grouped AS (
    SELECT
        robot_id, sport, COALESCE(weight_class, '') AS wc, scope, season,
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
    GROUP BY robot_id, sport, COALESCE(weight_class, ''), scope, season
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

-- 2. Delete the now-redundant duplicate rows.
DELETE FROM rankings r
USING (
    SELECT robot_id, sport, COALESCE(weight_class, '') AS wc, scope, season, MIN(id::text)::uuid AS keep_id
    FROM rankings
    WHERE robot_id IS NOT NULL
    GROUP BY robot_id, sport, COALESCE(weight_class, ''), scope, season
    HAVING COUNT(*) > 1
) g
WHERE r.robot_id = g.robot_id
  AND r.sport = g.sport
  AND COALESCE(r.weight_class, '') = g.wc
  AND r.scope = g.scope
  AND r.season = g.season
  AND r.id <> g.keep_id;

-- 3. Now safe to add the constraint. Expression index (COALESCE) rather
-- than a plain UNIQUE constraint because Postgres treats NULL as distinct
-- from NULL in uniqueness checks, and weight_class is nullable
-- (open/any class) — a plain constraint would silently fail to catch a
-- future duplicate pair that both have a null weight_class.
CREATE UNIQUE INDEX uk_ranking_natural_key
    ON rankings (robot_id, sport, COALESCE(weight_class, ''), scope, season)
    WHERE robot_id IS NOT NULL;
