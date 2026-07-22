-- event_certificates (the old free-text-URL, manually-typed-position table)
-- is superseded by certificate_types / issued_certificates (V8-V12). It
-- predates the Flyway cutover (captured into the baseline snapshot, no
-- earlier V-file exists for it) so it's deprecated in place, not dropped —
-- a one-off backfill (application-level, not this migration) copies its
-- rows into issued_certificates with provider = 'LEGACY_MANUAL' so
-- historical organizer-issued PDFs still surface in "My Certificates".
ALTER TABLE event_certificates ADD COLUMN deprecated_at TIMESTAMP;

COMMENT ON TABLE event_certificates IS
    'Deprecated: superseded by certificate_types / issued_certificates (V8-V12). Kept read-only for historical organizer-issued PDFs pasted before the migration.';
