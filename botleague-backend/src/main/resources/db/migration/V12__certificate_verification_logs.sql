-- Every QR scan / verification-page hit — the fraud-detection trail from
-- the design doc §10. IP is hashed at write time; no raw IP is ever stored.

CREATE TABLE certificate_verification_logs (
    id                     UUID PRIMARY KEY,
    issued_certificate_id  UUID        REFERENCES issued_certificates(id),
    verified_at            TIMESTAMP   NOT NULL,
    ip_hash                VARCHAR(64),
    result                 VARCHAR(20) NOT NULL  -- VALID | REVOKED | NOT_FOUND
);

CREATE INDEX idx_cert_verify_log_cert ON certificate_verification_logs (issued_certificate_id);
CREATE INDEX idx_cert_verify_log_time ON certificate_verification_logs (verified_at);
