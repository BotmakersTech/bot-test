-- Round-wise time trial (Robo Race / RC Racing Car / Line Follower) — see
-- com.botleague.backend.timetrial. Sibling to the matches/bracket tables,
-- for sports where a round is an arbitrary-N field ranked by time rather
-- than a 2-4 team head-to-head match.

CREATE TABLE time_trial_rounds (
    id                     UUID PRIMARY KEY,
    event_sport_id         UUID NOT NULL,
    round_number           INTEGER NOT NULL,
    status                 VARCHAR(20) NOT NULL,
    cutoff_count           INTEGER,
    actual_advanced_count  INTEGER,
    created_by             UUID,
    created_at             TIMESTAMP NOT NULL,
    updated_at             TIMESTAMP,
    deleted_at             TIMESTAMP,
    version                BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_ttr_event_sport_round UNIQUE (event_sport_id, round_number)
);

CREATE INDEX idx_ttr_event_sport ON time_trial_rounds (event_sport_id);

CREATE TABLE time_trial_entries (
    id                UUID PRIMARY KEY,
    round_id          UUID NOT NULL REFERENCES time_trial_rounds (id),
    event_sport_id    UUID NOT NULL,
    registration_id   UUID NOT NULL,
    time_millis       BIGINT,
    dnf               BOOLEAN NOT NULL DEFAULT FALSE,
    status            VARCHAR(20) NOT NULL,
    rank_in_round     INTEGER,
    notes             VARCHAR(500),
    recorded_by       UUID,
    recorded_at       TIMESTAMP,
    created_at        TIMESTAMP NOT NULL,
    updated_at        TIMESTAMP,
    version           BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_tte_round_registration UNIQUE (round_id, registration_id)
);

CREATE INDEX idx_tte_round ON time_trial_entries (round_id);
CREATE INDEX idx_tte_event_sport ON time_trial_entries (event_sport_id);
CREATE INDEX idx_tte_registration ON time_trial_entries (registration_id);
