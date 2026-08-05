-- Volunteer self-service application workflow: an event can now be flagged
-- as accepting volunteer applications, and event_volunteers rows gain a
-- review status so a VOLUNTEER-role user's self-submitted application can
-- sit PENDING until an organiser approves/rejects it. Organiser-added rows
-- (the existing roster-management flow) default to APPROVED — they never
-- went through a review step and shouldn't start requiring one.

ALTER TABLE events ADD COLUMN volunteers_needed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE event_volunteers ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE event_volunteers ADD CONSTRAINT event_volunteers_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE event_volunteers ADD COLUMN applied_at TIMESTAMP;
ALTER TABLE event_volunteers ADD COLUMN decided_at TIMESTAMP;
ALTER TABLE event_volunteers ADD COLUMN decided_by UUID;

-- One active (non-rejected) application per user per event — the service
-- layer already checks this, this is the backstop against a race between
-- two concurrent apply() calls.
CREATE UNIQUE INDEX idx_volunteer_event_user_active ON event_volunteers(event_id, user_id)
    WHERE user_id IS NOT NULL AND status <> 'REJECTED';
