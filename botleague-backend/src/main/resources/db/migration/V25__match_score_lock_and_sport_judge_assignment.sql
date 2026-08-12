-- Explicit admin score lock — independent of the match status lifecycle.
ALTER TABLE matches ADD COLUMN score_locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN locked_by UUID;
ALTER TABLE matches ADD COLUMN locked_at TIMESTAMP;

-- Judge scoring rights are now granted sport-wide via event_judges
-- (assigned_sport_id + scoring_rights), replacing the old per-match
-- match_judge_assignments grant. Index the lookup AuthorizationService.
-- canScoreMatch() now performs on every score mutation.
CREATE INDEX IF NOT EXISTS idx_event_judges_sport_user ON event_judges (assigned_sport_id, user_id);
