-- RC Racing Car already existed as a DRAFT placeholder pairing for Inferno
-- and Apex (V27) — it was hidden from the public catalog because DRAFT rows
-- are filtered out there, not because no row existed. Ignite never had a
-- pairing at all. Robo Race and RC Racing Car are confirmed to be different
-- sports (not interchangeable), so this keeps V27's own placeholder spec
-- rather than borrowing Robo Race's numbers — real weight/size limits are
-- still pending from an admin, same as the existing entry_note says, and
-- both rows stay editable via /admin/catalog once real numbers are known.

UPDATE league_sports
SET status = 'LIVE'
WHERE id = '30000000-0000-0000-0000-000000000009';

INSERT INTO league_sports (id, league_id, sport_id, weight_limit_kg, max_length_cm, max_width_cm, max_height_cm, extra_specs_json, entry_note, status, display_order, created_at)
VALUES
    ('30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000007', NULL, NULL, NULL, NULL, '{"scale":"1:8"}', 'Placeholder spec — scale/fuel type pending real numbers from admin', 'LIVE', 5, CURRENT_TIMESTAMP);
