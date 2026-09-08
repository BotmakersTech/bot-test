-- Same root cause as V16 and V19 — notifications.type's check constraint
-- predates Flyway management and must be widened by hand every time
-- NotificationType gains a value. EVENT_PUBLISHED and EVENT_LIVE were added
-- to the Java enum after V19 and never made it into this constraint, so
-- every attempt to notify on an event being published or going live has
-- failed at the database layer since. systemNotify() is @Async, so the
-- failure never surfaced to the caller — Publish/Start Techfect both kept
-- working normally while the notification silently never got created.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'EVENT_CREATED', 'EVENT_PUBLISHED', 'EVENT_LIVE', 'EVENT_UPDATED', 'EVENT_CANCELLED',
        'REGISTRATION_OPENED', 'REGISTRATION_CLOSED',
        'SPORT_ADDED', 'SPORT_UPDATED', 'RULEBOOK_UPDATED', 'SPORT_SUBMITTED_FOR_APPROVAL',
        'MATCH_SCHEDULED', 'MATCH_UPDATED', 'MATCH_COMPLETED',
        'RESULT_PUBLISHED', 'WINNER_DECLARED',
        'RANKING_UPDATED', 'RANKING_PUBLISHED',
        'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED',
        'TEAM_INVITE_RECEIVED', 'TEAM_INVITE_ACCEPTED', 'TEAM_INVITE_REJECTED', 'TEAM_INVITE_REVOKED',
        'TEAM_MEMBER_JOINED', 'TEAM_MEMBER_LEFT', 'TEAM_MEMBER_REMOVED', 'TEAM_ROLE_ASSIGNED', 'CAPTAIN_TRANSFERRED',
        'ROBOT_ADDED', 'ROBOT_UPDATED', 'ROBOT_DELETED',
        'CUSTOM_ANNOUNCEMENT', 'CUSTOM_ALERT', 'CUSTOM_UPDATE',
        'MATCH_CREATED', 'MATCH_STARTED', 'MATCH_ENDED', 'MATCH_CANCELLED', 'MATCH_RESCHEDULED',
        'LINEUP_SELECTED', 'QUALIFIED_QF', 'QUALIFIED_SF', 'QUALIFIED_FINAL',
        'TOURNAMENT_WINNER', 'RUNNER_UP', 'MATCH_REMINDER', 'ACHIEVEMENT_UNLOCKED',
        'ROLE_ASSIGNED', 'ROLE_ASSIGNMENT_APPROVED', 'ROLE_ASSIGNMENT_REJECTED',
        'MATCH_RESULT_PENDING_APPROVAL', 'EVENT_COMPLETED',
        'SPORT_CHANGE_REQUESTED', 'SPORT_CHANGE_APPROVED', 'SPORT_CHANGE_REJECTED',
        'NEWS_PUBLISHED',
        'ACCOUNT_PENDING_APPROVAL',
        'CERTIFICATE_ISSUED'
    ));
