-- Profile "pin code" (postal code) was a UI-only field on the profile page
-- that silently never persisted. Give it a real column. Kept as a short
-- varchar rather than a number so leading zeros (India PIN is 6 digits) and
-- other countries' alphanumeric postcodes survive round-tripping.
ALTER TABLE users ADD COLUMN pincode VARCHAR(20);
