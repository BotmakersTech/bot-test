-- A judge is onboarded to an event via event_judges (roster entry), but that
-- alone must not grant scoring rights to every match in the event — an admin
-- explicitly hands a judge specific generated matches, and only those matches
-- become scoreable by them. This join table is the source of truth for that.

CREATE TABLE match_judge_assignments (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL,
    judge_user_id UUID NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (match_id, judge_user_id)
);

CREATE INDEX idx_mja_match ON match_judge_assignments(match_id);
CREATE INDEX idx_mja_judge ON match_judge_assignments(judge_user_id);
