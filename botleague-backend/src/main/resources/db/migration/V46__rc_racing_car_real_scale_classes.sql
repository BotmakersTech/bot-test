-- V27 seeded RC Racing Car with a single placeholder scale ("1:8") and an
-- entry_note saying real numbers were still pending from an admin. Sets the
-- real, pickable scale classes — mirrors how Apex's Robo War carries more
-- than one weight class (weight_classes_json) to drive its picker; RC Racing
-- Car's equivalent lives in extra_specs_json.scale as a comma list (see
-- catalog.api.ts's toScaleClasses()).

UPDATE league_sports
SET extra_specs_json = '{"scale":"1:8,1:10,1:12"}',
    entry_note = NULL
WHERE id IN (
    '30000000-0000-0000-0000-000000000009', -- Inferno · RC Racing Car
    '30000000-0000-0000-0000-000000000014'  -- Apex · RC Racing Car
);
