-- Course-correct V28: RC Racing Car belongs to Inferno + Apex, not Ignite —
-- matching V27's own original DRAFT placeholders (Inferno + Apex only,
-- Ignite never had one). Removes the Ignite pairing V28 added and makes
-- Apex's existing DRAFT row LIVE the same way V28 already did for Inferno.

DELETE FROM league_sports
WHERE id = '30000000-0000-0000-0000-000000000016';

UPDATE league_sports
SET status = 'LIVE'
WHERE id = '30000000-0000-0000-0000-000000000014';
