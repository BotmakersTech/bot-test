-- The team edit/create forms have always had a Pin Code field, but Team
-- never had a column for it, so it was kept in local component state only
-- and silently discarded on save.
ALTER TABLE teams ADD COLUMN pincode VARCHAR(20);
