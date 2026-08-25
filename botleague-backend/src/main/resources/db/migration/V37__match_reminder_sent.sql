-- Tracks whether the MATCH_REMINDER notification has already gone out for a
-- match, so MatchReminderScheduler's periodic poll (every 60s, looking for
-- SCHEDULED matches within the reminder window) never sends it twice.

ALTER TABLE matches ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_matches_reminder_pending
    ON matches(scheduled_at)
    WHERE status = 'SCHEDULED' AND reminder_sent = FALSE;
