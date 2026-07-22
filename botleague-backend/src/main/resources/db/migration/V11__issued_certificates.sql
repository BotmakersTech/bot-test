-- The final, per-recipient artifact. Immutable after issuance except for
-- `status` (revoke) — a correction supersedes rather than mutates. See
-- design doc §2/§18.

CREATE TABLE issued_certificates (
    id                       UUID PRIMARY KEY,
    certificate_number       VARCHAR(60)  NOT NULL,
    certificate_type_id      UUID         NOT NULL REFERENCES certificate_types(id),
    generation_job_id        UUID         NOT NULL REFERENCES certificate_generation_jobs(id),

    recipient_user_id        UUID,                      -- null for role-based non-account recipients
    recipient_name_snapshot  VARCHAR(160) NOT NULL,
    team_id                  UUID,
    team_name_snapshot       VARCHAR(160),
    robot_id                 UUID,
    robot_name_snapshot      VARCHAR(160),

    event_id                 UUID         NOT NULL,
    event_sport_id           UUID         NOT NULL,
    position_snapshot        INTEGER,

    pdf_key                  TEXT         NOT NULL,
    image_key                TEXT         NOT NULL,
    qr_key                   TEXT,
    verification_url         TEXT         NOT NULL,
    signature_hash            VARCHAR(128),

    status                   VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | REVOKED | SUPERSEDED
    revoked_reason           TEXT,
    revoked_by                UUID,
    revoked_at                TIMESTAMP,

    issued_at                 TIMESTAMP    NOT NULL,
    version                   BIGINT       NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_issued_certificate_number ON issued_certificates (certificate_number);

-- DB-level backstop against double-issuing the same certificate type to the
-- same recipient — a superseded row (correction) doesn't block a fresh one.
-- COALESCE folds the two "who is this for" shapes (a real user vs a
-- role-based recipient identified only by name) into one comparable key.
CREATE UNIQUE INDEX uk_issued_certificate_recipient
    ON issued_certificates (
        certificate_type_id,
        COALESCE(recipient_user_id::text, recipient_name_snapshot),
        COALESCE(robot_id::text, '')
    )
    WHERE status != 'SUPERSEDED';

CREATE INDEX idx_issued_cert_recipient ON issued_certificates (recipient_user_id);
CREATE INDEX idx_issued_cert_event     ON issued_certificates (event_id);
CREATE INDEX idx_issued_cert_type      ON issued_certificates (certificate_type_id);
CREATE INDEX idx_issued_cert_job       ON issued_certificates (generation_job_id);
