-- Content-category tag for News, replacing the "sport interest" targeting
-- facet in the Create News UI with a genuine editorial category. Nullable
-- (= uncategorized) rather than defaulting to one of the real values.

ALTER TABLE news ADD COLUMN category VARCHAR(30);
