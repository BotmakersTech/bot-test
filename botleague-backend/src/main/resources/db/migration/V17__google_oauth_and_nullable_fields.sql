-- Sign in with Google: a fresh Google-signup user has no phone, no password,
-- and no chosen role yet (all three are collected/chosen after the fact via
-- mandatory post-login steps), so these columns must become nullable.
-- Postgres treats multiple NULLs as distinct values under a UNIQUE
-- constraint, so nullable+unique needs no partial-index trick.
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN account_type DROP NOT NULL;

-- Links a User row to a Google identity. UNIQUE already creates its own index.
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;

-- Distinguishes accounts that can/can't log in with a password without having
-- to infer it from password_hash being null.
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE users ADD CONSTRAINT users_auth_provider_check
    CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));
