-- Match.version (@Version, JPA optimistic locking) was declared on the
-- entity but never added to the real schema — same class of drift as V21.
-- Existing rows get 0 so Hibernate's version comparison has a real starting
-- point instead of NULL.

ALTER TABLE matches ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
