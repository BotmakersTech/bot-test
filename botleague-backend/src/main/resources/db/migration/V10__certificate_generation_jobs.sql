-- A generation job is one "Generate" click over one allocation. See design
-- doc §7/§8 — chunked, checkpointed, one job row tracks the whole batch.

CREATE TABLE certificate_generation_jobs (
    id                  UUID PRIMARY KEY,
    certificate_type_id UUID        NOT NULL REFERENCES certificate_types(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | RUNNING | COMPLETED | PARTIAL | FAILED
    total_recipients    INTEGER     NOT NULL DEFAULT 0,
    succeeded_count     INTEGER     NOT NULL DEFAULT 0,
    failed_count        INTEGER     NOT NULL DEFAULT 0,
    error_summary       TEXT,
    triggered_by        UUID        NOT NULL,
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP   NOT NULL
);

CREATE INDEX idx_cert_job_type   ON certificate_generation_jobs (certificate_type_id);
CREATE INDEX idx_cert_job_status ON certificate_generation_jobs (status);
