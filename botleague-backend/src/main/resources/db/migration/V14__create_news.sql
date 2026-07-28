-- Platform-wide News: admin-authored content targeted by age category
-- and/or sport interest, resolved independently then intersected (see
-- NewsService). Distinct from event_announcements (event-scoped, different
-- targeting shape entirely) — kept as a separate table rather than forcing
-- both shapes into one sparse polymorphic table.

CREATE TABLE news (
    id                        UUID PRIMARY KEY,
    title                     VARCHAR(255) NOT NULL,
    body                      TEXT         NOT NULL,
    created_by                UUID         NOT NULL,

    -- JSON array of AgeCategory enum names, e.g. ["JUNIOR_INNOVATORS"].
    -- Null/empty = no age restriction (matches every age).
    target_age_categories     TEXT,

    -- JSON array of sport catalogue value strings, e.g. ["ROBO_WAR"].
    -- Null/empty = no sport restriction.
    target_sports             TEXT,

    attachment_url            TEXT,
    attachment_key            TEXT,
    attachment_file_type      VARCHAR(100),

    is_pinned                 BOOLEAN      NOT NULL DEFAULT FALSE,
    is_archived               BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Snapshot of resolved-recipient count at publish time (admin list
    -- display only — not upkept afterwards).
    recipient_count           INTEGER      NOT NULL DEFAULT 0,

    -- Traceability to the Notification fan-out this News triggered.
    notification_id           UUID,

    published_at              TIMESTAMP    NOT NULL,
    created_at                TIMESTAMP    NOT NULL,
    updated_at                TIMESTAMP
);

CREATE INDEX idx_news_published_at ON news (published_at);
CREATE INDEX idx_news_is_archived  ON news (is_archived);
CREATE INDEX idx_news_created_by   ON news (created_by);
