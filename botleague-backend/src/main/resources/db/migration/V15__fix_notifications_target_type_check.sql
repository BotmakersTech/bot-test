-- The notifications table (and its target_type check constraint) predates
-- Flyway management for this table, so its constraint was never widened
-- when NotificationTargetType gained PLATFORM_ADMINS/NEWS — publishing News
-- or any PLATFORM_ADMINS notification fails with a check-constraint
-- violation. Recreate the constraint to match NotificationTargetType.java
-- exactly.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_target_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_target_type_check
    CHECK (target_type IN ('ALL_USERS', 'ALL_TEAMS', 'EVENT', 'SPORT', 'TEAM', 'USER', 'PLATFORM_ADMINS', 'NEWS'));
