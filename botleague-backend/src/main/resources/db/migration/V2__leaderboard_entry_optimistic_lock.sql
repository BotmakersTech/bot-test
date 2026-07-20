-- updateLeaderboardEntry() does pointsEarned += x as a read-modify-write —
-- without this, two matches for the same robot approved concurrently by
-- different threads can lose an update (part of audit finding B-6).
ALTER TABLE event_leaderboard_entries ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
