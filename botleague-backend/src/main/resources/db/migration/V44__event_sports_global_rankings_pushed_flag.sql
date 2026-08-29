-- Tracks whether an event sport's leaderboard has ever been pushed to the
-- cross-event global ranking pool, so autoFinalizeIfLastMatch knows whether
-- to use the additive pushToGlobalRankings (first time) or the absolute
-- fullRecalculate (any subsequent re-finalize, e.g. after a score
-- correction reopens and re-approves a match) — pushToGlobalRankings is not
-- idempotent and would double-count global totals on a second call.

ALTER TABLE event_sports ADD COLUMN global_rankings_pushed BOOLEAN NOT NULL DEFAULT FALSE;
