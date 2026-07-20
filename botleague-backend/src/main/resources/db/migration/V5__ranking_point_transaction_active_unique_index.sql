-- DB-level backstop for awardMatchPoints()'s (match, robot) idempotency
-- check (existsByMatchIdAndRobotId), which was application-level only —
-- nothing stopped a duplicate row under concurrent writers (part of B-6).
-- Partial (is_voided = false only) since a voided transaction can
-- legitimately be superseded by a new one for the same match+robot
-- (see MatchService.correctMatchResult / RankingEngineService.voidPointsForMatch).
CREATE UNIQUE INDEX uk_rpt_match_robot_active
    ON ranking_point_transactions (match_id, robot_id)
    WHERE is_voided = false;
