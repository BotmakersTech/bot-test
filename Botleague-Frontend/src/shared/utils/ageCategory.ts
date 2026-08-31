// Age-category helpers — mirror the backend EligibilityUtils bands so the UI
// can hide people who can't be in a techsport's age group instead of letting
// them be picked and then failing with an "age mismatch" on submit.

/** Whole years from a YYYY-MM-DD (or ISO) date of birth; null if unparseable. */
export function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

/** DOB -> AgeCategory code, or null when we can't tell (missing / under-8 / bad date). */
export function ageCategoryFromDob(dob?: string | null): string | null {
  const age = ageFromDob(dob);
  if (age == null) return null;
  if (age >= 8 && age <= 11) return "JUNIOR_INNOVATORS";
  if (age >= 12 && age <= 17) return "YOUNG_ENGINEERS";
  if (age >= 18) return "ROBO_MINDS";
  return null;
}

// Age groups that mean "anyone" — never filtered on.
const OPEN_GROUPS = new Set(["", "OPEN", "ALL", "ALL_AGES", "ANY", "UNRESTRICTED"]);

/**
 * Can a person with this DOB be in a techsport whose required age group is
 * `ageGroup`? Unknown DOB -> true: we don't hide someone just because their
 * birthday isn't on file (the backend still enforces it on submit).
 */
export function fitsAgeGroup(dob: string | null | undefined, ageGroup?: string | null): boolean {
  const g = (ageGroup ?? "").toUpperCase();
  if (OPEN_GROUPS.has(g)) return true;
  const cat = ageCategoryFromDob(dob);
  if (cat == null) return true;
  return cat === g;
}
