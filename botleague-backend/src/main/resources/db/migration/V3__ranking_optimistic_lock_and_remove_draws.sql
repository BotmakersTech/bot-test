-- updateGlobalRankings()/fullRecalculate() do read-modify-write accumulation
-- (totalPoints += x etc.) — without this, two concurrent admin-triggered
-- pushes/recalcs for the same robot can lose an update (part of B-6).
ALTER TABLE rankings ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Dead schema: persisted but never incremented anywhere. Confirmed
-- structurally impossible to reach — submitMatchResult() rejects a tied
-- score outright unless an explicit winner is supplied, so a COMPLETED
-- match always has a winner; there is no draw outcome in this platform's
-- rules. Removed rather than wired up for an outcome that can't occur.
ALTER TABLE rankings DROP COLUMN draws;
