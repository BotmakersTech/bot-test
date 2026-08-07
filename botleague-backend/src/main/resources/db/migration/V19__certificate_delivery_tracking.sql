-- Certificates were generated and stored but never actually delivered to
-- their recipient — no email, no in-app notification, and no record of
-- whether anyone even tried. This adds per-certificate delivery tracking
-- (email + in-app) so a completed generation run can show not just "24
-- issued" but "24 issued, 22 delivered, 2 need attention", and so a
-- failed delivery can be retried without re-generating the certificate.

ALTER TABLE issued_certificates ADD COLUMN recipient_email_snapshot VARCHAR(255);
ALTER TABLE issued_certificates ADD COLUMN delivery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE issued_certificates ADD COLUMN delivery_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE issued_certificates ADD COLUMN last_delivery_error TEXT;
ALTER TABLE issued_certificates ADD COLUMN delivered_at TIMESTAMP;
ALTER TABLE issued_certificates ADD COLUMN in_app_notified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE issued_certificates ADD CONSTRAINT issued_certificates_delivery_status_check
    CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED'));

CREATE INDEX idx_issued_cert_delivery_status ON issued_certificates (generation_job_id, delivery_status);

-- Same recurring gotcha as V15/V16: the notifications.type CHECK constraint
-- predates Flyway management and must be widened by hand every time
-- NotificationType gains a value — CERTIFICATE_ISSUED is the new one here.
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
        'ACCOUNT_PENDING_APPROVAL',
        'CERTIFICATE_ISSUED'
    ));
