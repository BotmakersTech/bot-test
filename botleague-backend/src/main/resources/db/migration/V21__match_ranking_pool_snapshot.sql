-- Match.weightClassSnapshot / Match.ageGroupSnapshot were declared on the
-- entity (captured at bracket-generation time so a later sport-spec edit
-- can't retroactively move an already-played match's ranking points) but
-- no migration ever added the columns to the real schema — ddl-auto is
-- validate-only, so this was silent schema drift until a fresh boot
-- surfaced it as a hard startup failure.

ALTER TABLE matches
    ADD COLUMN weight_class_snapshot VARCHAR(20),
    ADD COLUMN age_group_snapshot VARCHAR(30);
