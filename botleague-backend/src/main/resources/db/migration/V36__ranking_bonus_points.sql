-- Lets an admin/sport-head award (or dock) discretionary points to a team's
-- registration in a sport's leaderboard — e.g. a sportsmanship bonus, or a
-- penalty that doesn't map to a match result. Deliberately not tied to a
-- match_id (unlike ranking_point_transactions, which is per-match) since a
-- bonus isn't the result of playing a specific match.
--
-- LeaderboardService folds the per-registration sum of this table into
-- pointsFor before computing pointDifferential, so a bonus can break a tie
-- (or create one) but never overrides the actual bracket result — see
-- LeaderboardService.rankSingleElimination/rankDoubleElimination, which
-- still decide standing primarily by how far a team advanced.

CREATE TABLE ranking_bonus_points (
    id UUID PRIMARY KEY,
    event_sport_id UUID NOT NULL,
    registration_id UUID NOT NULL,
    points INT NOT NULL,
    reason TEXT,
    awarded_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_rbp_event_sport   ON ranking_bonus_points(event_sport_id);
CREATE INDEX idx_rbp_registration  ON ranking_bonus_points(registration_id);
