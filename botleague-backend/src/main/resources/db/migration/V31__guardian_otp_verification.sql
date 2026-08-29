-- Guardian consent was previously self-attested: any authenticated user
-- could type in a guardian's name/phone/email and that record alone was
-- treated as proof of parental consent for the under-18 eligibility gate.
-- guardians now carries a verification status — the record starts PENDING
-- and only becomes CONFIRMED once the guardian themselves enters an OTP
-- sent to their own phone (see GuardianService).

ALTER TABLE guardians ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE guardians ADD CONSTRAINT guardians_status_check
    CHECK (status IN ('PENDING', 'CONFIRMED'));

ALTER TABLE guardians ADD COLUMN verified_at TIMESTAMP;
