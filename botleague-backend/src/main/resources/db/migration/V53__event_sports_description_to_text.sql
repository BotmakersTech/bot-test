-- event_sports.sports_info held the sport's public write-up (the "sportData"
-- field the Add Sport form sends) as varchar(255). A normal description —
-- summary, an instructions list, a closing line — runs well past that, and
-- the overflow surfaced through the generic data-integrity handler as a 409
-- "duplicate email or phone number", which sent people looking for a
-- non-existent duplicate sport. Every other free-text description column on
-- the schema (events, catalog sports) is already TEXT; this one was missed.
ALTER TABLE event_sports ALTER COLUMN sports_info TYPE text;
