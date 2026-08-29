-- Location map link (a Google Maps share URL, which can be long) for the event
-- and — as a per-sport override — for each event sport.
ALTER TABLE events ADD COLUMN map_url VARCHAR(2048);
ALTER TABLE event_sports ADD COLUMN map_url VARCHAR(2048);

-- Structured prize breakdown per placing. JSON array of
--   {"position":1,"type":"MONEY","amount":50000,"description":null}
--   {"position":2,"type":"GOODIES","amount":null,"description":"Trophy + kit"}
-- Parsed/serialized in EventSportsService (same raw-string-plus-Jackson
-- approach as league_sports.weight_classes_json). The MONEY entries must sum
-- to event_sports.prize_money — enforced in the service, not the DB.
ALTER TABLE event_sports ADD COLUMN prize_distribution_json TEXT;
