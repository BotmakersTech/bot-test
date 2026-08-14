-- Backend-driven League / Sport / LeagueSport catalog — replaces the
-- previously hardcoded frontend league+sport+spec data. No CHECK
-- constraints on status columns (see V15/V16 — a past migration had to
-- walk back exactly that mistake when a new status value was needed).

CREATE TABLE leagues (
    id                UUID PRIMARY KEY,
    slug              VARCHAR(60)  NOT NULL,
    age_group_code    VARCHAR(60)  NOT NULL,     -- stable eligibility key, e.g. "JUNIOR_INNOVATORS"
    name              VARCHAR(100) NOT NULL,
    min_age           INTEGER,
    max_age           INTEGER,                    -- null = unbounded (e.g. "18+")
    tagline           VARCHAR(200),
    description       TEXT,
    primary_color     VARCHAR(20),
    secondary_color   VARCHAR(20),
    what_you_get_json TEXT,
    ranking_scope     VARCHAR(40),
    next_league_id    UUID,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DISABLED
    display_order     INTEGER      NOT NULL DEFAULT 0,
    created_by        UUID,
    created_at        TIMESTAMP    NOT NULL,
    updated_at        TIMESTAMP,
    version           BIGINT       NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_league_slug ON leagues (slug);
CREATE UNIQUE INDEX uk_league_age_group_code ON leagues (age_group_code);

CREATE TABLE sports (
    id                     UUID PRIMARY KEY,
    name                   VARCHAR(100) NOT NULL,
    slug                   VARCHAR(100) NOT NULL,
    competition_type_hint  VARCHAR(40),           -- advisory only, not a hard FK
    description            TEXT,
    icon_url               TEXT,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DISABLED
    display_order          INTEGER      NOT NULL DEFAULT 0,
    created_by             UUID,
    created_at             TIMESTAMP    NOT NULL,
    updated_at             TIMESTAMP,
    version                BIGINT       NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_sport_slug ON sports (slug);

-- A Sport's specs *within* one League — this is where the actual spec and
-- the DRAFT/LIVE "visible to organisers" gate live. Field names mirror
-- event_sports 1:1 so applying a preset is a straight copy.
CREATE TABLE league_sports (
    id                   UUID PRIMARY KEY,
    league_id            UUID         NOT NULL REFERENCES leagues(id),
    sport_id             UUID         NOT NULL REFERENCES sports(id),
    weight_limit_kg      DOUBLE PRECISION,
    max_length_cm        DOUBLE PRECISION,
    max_width_cm         DOUBLE PRECISION,
    max_height_cm        DOUBLE PRECISION,
    control_type         VARCHAR(20),             -- WIRED | WIRELESS | ANY
    max_bots_per_team    INTEGER,
    weight_classes_json  TEXT,                    -- [{"label":"1.5kg","weightKg":1.5}, ...]
    extra_specs_json     TEXT,                    -- Map<String,String> (drone diameter, track size, ...)
    entry_note           VARCHAR(300),
    status               VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',   -- DRAFT | LIVE
    display_order        INTEGER      NOT NULL DEFAULT 0,
    created_by           UUID,
    created_at           TIMESTAMP    NOT NULL,
    updated_at           TIMESTAMP,
    version              BIGINT       NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_league_sport ON league_sports (league_id, sport_id);
CREATE INDEX idx_league_sport_league ON league_sports (league_id);
CREATE INDEX idx_league_sport_sport ON league_sports (sport_id);
