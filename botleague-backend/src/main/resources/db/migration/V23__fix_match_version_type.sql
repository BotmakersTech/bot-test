-- V22 added matches.version as INTEGER, but Match.version is declared as
-- Long (unlike User.version, which is Integer) — Hibernate expects bigint.

ALTER TABLE matches ALTER COLUMN version TYPE BIGINT;
