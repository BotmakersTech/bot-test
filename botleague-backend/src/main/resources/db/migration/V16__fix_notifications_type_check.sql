-- Same root cause as V15, different columns: notifications.type and
-- notifications.priority's check constraints also predate Flyway
-- management and were never widened as their enums grew (most recently
-- NEWS_PUBLISHED and ACCOUNT_PENDING_APPROVAL on NotificationType) —
-- publishing News still failed after V15 because this sibling constraint
-- on `type` rejected NEWS_PUBLISHED. Recreating both here proactively so a
-- currently-unused NotificationPriority value (IMPORTANT/CRITICAL/
-- ACHIEVEMENT) doesn't cause the same failure the next time one is used.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_CANCELLED', 'REGISTRATION_OPENED', 'REGISTRATION_CLOSED',
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
        'ACCOUNT_PENDING_APPROVAL'
    ));

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_priority_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_priority_check
    CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW', 'IMPORTANT', 'CRITICAL', 'ACHIEVEMENT'));
