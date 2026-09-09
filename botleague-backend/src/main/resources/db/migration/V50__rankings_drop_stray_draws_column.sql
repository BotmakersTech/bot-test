-- V3 already dropped rankings.draws (dead schema — draws can't structurally
-- occur; see that migration's own comment). On at least one database it
-- reappeared afterward with no DEFAULT and NOT NULL still set, and the
-- Ranking entity has never mapped a draws field since V3, so every INSERT
-- Hibernate generates omits it — meaning every push to the global ranking
-- pool fails outright with a NOT NULL violation, and nothing pushed ever
-- becomes visible on /rankings. IF EXISTS makes this safe to run whether or
-- not a given environment actually still has the column.
ALTER TABLE rankings DROP COLUMN IF EXISTS draws;
