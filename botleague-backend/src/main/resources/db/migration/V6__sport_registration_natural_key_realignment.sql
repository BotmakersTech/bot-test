-- The DB constraint was keyed on (event_sport_id, team_id, robot_name) —
-- name-based, so a renamed robot could double-register, or two unrelated
-- robots sharing a name would be wrongly blocked. robotId is a real FK to a
-- persistent Robot record and is the actual natural key: registerRobot()'s
-- own dedup/reactivation logic (SportRegistrationService) was already
-- robot_id-based even before this constraint caught up.
--
-- Unlike the Ranking dedupe (V4), these are real registration records, not
-- pure accumulator stats — merging two conflicting registrations isn't a
-- safe, automatic decision. If any duplicates already exist under the new
-- key, fail loudly and let a human resolve them rather than silently
-- picking a "winner".
DO $$
DECLARE
    dupe_count integer;
BEGIN
    SELECT COUNT(*) INTO dupe_count
    FROM (
        SELECT event_sport_id, robot_id
        FROM sport_registrations
        WHERE robot_id IS NOT NULL
        GROUP BY event_sport_id, robot_id
        HAVING COUNT(*) > 1
    ) d;

    IF dupe_count > 0 THEN
        RAISE EXCEPTION
            'Cannot add uk_registration_robot (event_sport_id, robot_id): % existing duplicate group(s) found. '
            'Resolve these manually (decide which registration per group is canonical) before re-running this migration.',
            dupe_count;
    END IF;
END $$;

ALTER TABLE sport_registrations DROP CONSTRAINT uk_registration_robot;
ALTER TABLE sport_registrations ADD CONSTRAINT uk_registration_robot
    UNIQUE (event_sport_id, robot_id);
