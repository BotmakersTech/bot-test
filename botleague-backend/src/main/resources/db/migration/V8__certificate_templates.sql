-- Certificate Management System (see the design doc shared with the team) —
-- V8 lays the foundation: the template asset table. Scoped to Event and
-- EventSports only — no Season/Episode concept in this platform.

CREATE TABLE certificate_templates (
    id                    UUID PRIMARY KEY,
    provider              VARCHAR(20)  NOT NULL,           -- BOTLEAGUE | ORGANISER
    owner_user_id         UUID,                            -- organiser's user id; set only when provider = ORGANISER
    name                  VARCHAR(120) NOT NULL,
    background_asset_key  TEXT         NOT NULL,           -- R2 object key
    page_width_px         INTEGER      NOT NULL,
    page_height_px        INTEGER      NOT NULL,
    placeholder_map       TEXT         NOT NULL DEFAULT '[]', -- JSON array, see design doc §5
    status                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT', -- DRAFT | ACTIVE | ARCHIVED
    created_by            UUID         NOT NULL,
    created_at            TIMESTAMP    NOT NULL,
    updated_at            TIMESTAMP,
    version               BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX idx_cert_template_provider ON certificate_templates (provider);
CREATE INDEX idx_cert_template_owner    ON certificate_templates (owner_user_id);
