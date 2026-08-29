-- H8/H9/M3: AdminTeamService.createAdminTeam raced two concurrent captains
-- into "one active team" with only an application-level check-then-insert
-- guarding it, and deleteTeam hard-deleted with no cascade, orphaning
-- memberships/robots/registrations/invites. This closes the race with a
-- DB-level backstop (same partial-unique-index style as V7) and switches
-- team deletion to soft-delete (same deletedAt pattern already used by
-- robots), so history survives and a deleted team's name/code can be reused.

ALTER TABLE team_memberships ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- One ACTIVE membership per user, enforced by the database rather than only
-- by the service-layer check in AdminTeamService.createAdminTeam.
CREATE UNIQUE INDEX uk_team_membership_one_active
    ON team_memberships(user_id)
    WHERE status = 'ACTIVE';

ALTER TABLE teams ADD COLUMN deleted_at TIMESTAMP;

-- teams.team_code / teams.team_name were declared `unique = true` on the
-- entity (Hibernate/ddl-auto=update era), so the actual constraint name in
-- this database is whatever Postgres or Hibernate auto-generated for it at
-- the time — not knowable from the entity mapping alone. Look it up and
-- drop it dynamically rather than guessing a literal name that could fail
-- this migration outright if wrong.
DO $$
DECLARE
    con_name text;
BEGIN
    FOR con_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = current_schema()
          AND tc.table_name = 'teams'
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.column_name IN ('team_code', 'team_name')
    LOOP
        EXECUTE format('ALTER TABLE teams DROP CONSTRAINT %I', con_name);
    END LOOP;
END $$;

-- Replace with partial unique indexes so a soft-deleted team's code/name
-- can be reused by a new team.
CREATE UNIQUE INDEX uk_teams_team_code_active ON teams(team_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uk_teams_team_name_active ON teams(team_name) WHERE deleted_at IS NULL;
