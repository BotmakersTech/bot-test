-- M4 (scoped): user_roles and team_memberships are the two entities in this
-- codebase whose rows genuinely mutate after creation (role approval status,
-- team role/status changes) but had no updatedAt to show when. Their
-- existing assigned_at/joined_at already cover "created" — this only adds
-- what was actually missing.

ALTER TABLE user_roles ADD COLUMN updated_at TIMESTAMP;
UPDATE user_roles SET updated_at = COALESCE(approved_at, assigned_at) WHERE updated_at IS NULL;

ALTER TABLE team_memberships ADD COLUMN updated_at TIMESTAMP;
UPDATE team_memberships SET updated_at = COALESCE(left_at, joined_at) WHERE updated_at IS NULL;
