-- One row = one configured certificate for one Event Sport
-- (e.g. "RoboWar -> BotLeague Winner"). See design doc §2.

CREATE TABLE certificate_types (
    id                    UUID PRIMARY KEY,
    event_sport_id        UUID         NOT NULL,
    provider              VARCHAR(20)  NOT NULL,           -- BOTLEAGUE | ORGANISER
    category              VARCHAR(40)  NOT NULL,           -- PARTICIPATION | WINNER | RUNNER_UP | SECOND_RUNNER_UP | SPECIAL
    label                 VARCHAR(120) NOT NULL,           -- display name, e.g. "Best Innovation"
    template_id           UUID         NOT NULL REFERENCES certificate_templates(id),
    eligibility_rule      VARCHAR(30)  NOT NULL,           -- ALL_REGISTERED | RANK_EQUALS | MANUAL_SELECT
    eligibility_rank      INTEGER,                         -- populated only when eligibility_rule = RANK_EQUALS
    issue_mode            VARCHAR(20)  NOT NULL DEFAULT 'MANUAL_TRIGGER', -- AUTO_ON_FINALIZE | MANUAL_TRIGGER
    status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | DISABLED
    number_prefix         VARCHAR(20)  NOT NULL,
    number_format         VARCHAR(60)  NOT NULL,
    validity_years        INTEGER,                         -- null = never expires
    verification_enabled  BOOLEAN      NOT NULL DEFAULT TRUE,
    qr_enabled             BOOLEAN      NOT NULL DEFAULT TRUE,
    signature_enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by            UUID         NOT NULL,
    created_at            TIMESTAMP    NOT NULL,
    updated_at            TIMESTAMP,
    version               BIGINT       NOT NULL DEFAULT 0,

    -- A running sequence per certificate type — backs number_format's {seq}
    -- token without a COUNT(*) race under concurrent generation.
    next_sequence         BIGINT       NOT NULL DEFAULT 1
);

-- "BotLeague Winner" and "Organiser Winner" coexist by design; this only
-- blocks two identical (event_sport, provider, category, label) rows.
CREATE UNIQUE INDEX uk_certificate_type_natural_key
    ON certificate_types (event_sport_id, provider, category, label);

CREATE INDEX idx_cert_type_event_sport ON certificate_types (event_sport_id);
CREATE INDEX idx_cert_type_template    ON certificate_types (template_id);
