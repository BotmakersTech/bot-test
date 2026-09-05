-- Records the match type an event sport's bracket was generated with.
--
-- Until now the tournament-wide match type was read back off the match rows,
-- which worked only because every match in a bracket carried the same type.
-- Triple Threat and Fatal Four brackets are now built by partitioning each
-- round into matches of 2..3 or 2..4 competitors, and every match row is
-- tagged with its own participant count — so the rows no longer agree with
-- each other, and the organiser's choice is not always among them at all
-- (6 teams in Fatal Four yields rounds of 3+3 then 2: no 4-way anywhere).
--
-- Nullable on purpose: brackets generated before this column existed keep
-- NULL and fall back to sampling their match rows.
ALTER TABLE event_sports ADD COLUMN bracket_match_type VARCHAR(20);

-- Backfill from the existing brackets, which are uniform by construction:
-- every match in a pre-existing bracket carries the tournament-wide type.
UPDATE event_sports es
SET bracket_match_type = sub.match_type
FROM (
    SELECT DISTINCT ON (event_sport_id) event_sport_id, match_type
    FROM matches
    WHERE deleted_at IS NULL
      AND match_type IS NOT NULL
    ORDER BY event_sport_id, round_number, match_number
) AS sub
WHERE es.id = sub.event_sport_id
  AND es.bracket_match_type IS NULL;
