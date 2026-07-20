-- softDeleteEvent()/changeEventStatus() are read-check-write on
-- status/deletedAt — without this, two concurrent admin actions on the
-- same event could both pass their guard before either commits (B-16).
ALTER TABLE events ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- registeredTeamsCount is a read-modify-write increment/decrement from three
-- call sites (register/cancel/status-change) — without this, two concurrent
-- registration actions can race and lose an update to the capacity counter.
ALTER TABLE event_sports ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Guards concurrent review attempts on the same sport-change request.
ALTER TABLE sport_change_requests ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- DB-level backstop for the "only one pending request per sport" guard,
-- which was previously an unlocked existence check — two near-simultaneous
-- submissions could both pass it.
CREATE UNIQUE INDEX uk_sport_change_one_pending
    ON sport_change_requests (event_sport_id)
    WHERE status = 'PENDING';
