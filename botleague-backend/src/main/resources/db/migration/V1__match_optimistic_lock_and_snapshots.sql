-- Optimistic locking for Match: approveMatchResult()/rejectMatchResult()/
-- cancelMatch() are read-check-write on status; without this, two
-- concurrent approvals of the same match can both pass the status guard
-- before either commits, double-awarding ranking points (audit finding B-6).
ALTER TABLE matches ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Ranking-pool snapshot, captured at bracket-generation time. Sport specs
-- (weight class / age group) stay editable at any lifecycle stage by
-- design, so awardMatchPoints() must read these instead of live-reading
-- the sport row — otherwise a mid-tournament sport edit retroactively
-- moves an already-played match's points into a different ranking pool
-- (audit finding B-9). NULL for matches created before this migration;
-- application code falls back to a live read for those.
ALTER TABLE matches ADD COLUMN weight_class_snapshot VARCHAR(20);
ALTER TABLE matches ADD COLUMN age_group_snapshot VARCHAR(30);
