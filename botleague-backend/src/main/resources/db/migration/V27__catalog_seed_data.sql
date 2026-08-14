-- Seeds the 3 real leagues + 7 distinct sports + 15 league/sport pairings
-- per the confirmed seed data. age_group_code values match the existing
-- AgeCategory enum vocabulary ("JUNIOR_INNOVATORS" etc.) so the Tier-1
-- eligibility conversion (EventSports.ageGroup) needs zero remapping.

-- ── Leagues ──────────────────────────────────────────────────────────────
INSERT INTO leagues (id, slug, age_group_code, name, min_age, max_age, tagline, status, display_order, next_league_id, created_at)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'ignite',  'JUNIOR_INNOVATORS', 'Ignite',  8,  11,   'Where young innovators take their first shot',  'ACTIVE', 0, '10000000-0000-0000-0000-000000000002', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000002', 'inferno', 'YOUNG_ENGINEERS',   'Inferno', 12, 17,   'Turn up the heat — built for young engineers',   'ACTIVE', 1, '10000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000003', 'apex',    'ROBO_MINDS',        'Apex',    18, NULL, 'The peak tier — open for RoboMinds 18 and up',   'ACTIVE', 2, NULL,                                        CURRENT_TIMESTAMP);

-- ── Sports (reusable identities) ────────────────────────────────────────
INSERT INTO sports (id, name, slug, status, display_order, created_at)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'Robo Sumo',      'robo-sumo',      'ACTIVE', 0, CURRENT_TIMESTAMP),
    ('20000000-0000-0000-0000-000000000002', 'Robo Race',      'robo-race',      'ACTIVE', 1, CURRENT_TIMESTAMP),
    ('20000000-0000-0000-0000-000000000003', 'Robo Soccer',    'robo-soccer',    'ACTIVE', 2, CURRENT_TIMESTAMP),
    ('20000000-0000-0000-0000-000000000004', 'Drone Soccer',   'drone-soccer',   'ACTIVE', 3, CURRENT_TIMESTAMP),
    ('20000000-0000-0000-0000-000000000005', 'Line Follower',  'line-follower',  'ACTIVE', 4, CURRENT_TIMESTAMP),
    ('20000000-0000-0000-0000-000000000006', 'Robo War',       'robo-war',       'ACTIVE', 5, CURRENT_TIMESTAMP),
    ('20000000-0000-0000-0000-000000000007', 'RC Racing Car',  'rc-racing-car',  'ACTIVE', 6, CURRENT_TIMESTAMP);

-- ── Ignite pairings (all LIVE) ───────────────────────────────────────────
INSERT INTO league_sports (id, league_id, sport_id, weight_limit_kg, max_length_cm, max_width_cm, extra_specs_json, status, display_order, created_at)
VALUES
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1.0, NULL, NULL, NULL, 'LIVE', 0, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 1.0, NULL, NULL, NULL, 'LIVE', 1, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 1.0, NULL, NULL, NULL, 'LIVE', 2, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', NULL, NULL, NULL, '{"diameterCm":"12.5"}', 'LIVE', 3, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', NULL, 20, 20, NULL, 'LIVE', 4, CURRENT_TIMESTAMP);

-- ── Inferno pairings (RC Racing Car seeded DRAFT — placeholder spec) ────
INSERT INTO league_sports (id, league_id, sport_id, weight_limit_kg, max_length_cm, max_width_cm, max_height_cm, extra_specs_json, entry_note, status, display_order, created_at)
VALUES
    ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', 1.5, NULL, NULL, NULL, NULL, NULL, 'LIVE', 0, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 3.0, 30, 30, 30, NULL, NULL, 'LIVE', 1, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 3.0, 30, 30, 30, NULL, NULL, 'LIVE', 2, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', NULL, NULL, NULL, NULL, '{"scale":"1:8"}', 'Placeholder spec — scale/fuel type pending real numbers from admin', 'DRAFT', 3, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', NULL, NULL, NULL, NULL, '{"diameterCm":"20"}', NULL, 'LIVE', 4, CURRENT_TIMESTAMP);

-- ── Apex pairings (Robo War has 2 weight classes; RC Racing Car DRAFT) ──
INSERT INTO league_sports (id, league_id, sport_id, weight_limit_kg, max_length_cm, max_width_cm, max_height_cm, weight_classes_json, extra_specs_json, entry_note, status, display_order, created_at)
VALUES
    ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', NULL, NULL, NULL, NULL, '[{"label":"1.5kg","weightKg":1.5},{"label":"60kg","weightKg":60}]', NULL, NULL, 'LIVE', 0, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 3.0, 30, 30, 30, NULL, NULL, NULL, 'LIVE', 1, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 5.0, 45, 45, 45, NULL, NULL, NULL, 'LIVE', 2, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000007', NULL, NULL, NULL, NULL, NULL, '{"scale":"1:8"}', 'Placeholder spec — scale/fuel type pending real numbers from admin', 'DRAFT', 3, CURRENT_TIMESTAMP),
    ('30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', NULL, NULL, NULL, NULL, NULL, '{"diameterCm":"20"}', NULL, 'LIVE', 4, CURRENT_TIMESTAMP);
