-- V21-V23 are recorded as applied in flyway_schema_history but the columns
-- they added were found missing from `matches` on a later boot (schema
-- drift of unknown external cause, not a code change). Idempotent repair
-- rather than editing the already-applied migration files.

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS weight_class_snapshot VARCHAR(20),
    ADD COLUMN IF NOT EXISTS age_group_snapshot VARCHAR(30);

ALTER TABLE matches
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE matches
    ALTER COLUMN version TYPE BIGINT;
