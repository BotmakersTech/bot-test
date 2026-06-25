package com.botleague.backend.eligibility.dto;

public class EligibilityResponse {

    private int age;
    private String category;       // "JUNIOR_INNOVATORS" | "YOUNG_ENGINEERS" | "ROBO_MINDS" | null
    private String categoryLabel;  // "Junior Innovators" | "Young Engineers" | "Robo Minds" | null
    private String ageRange;       // "8–11 yrs" | "12–17 yrs" | "18+ yrs" | null
    private boolean eligible;      // age >= 8 and category != null
    private boolean requiresGuardian;
    private boolean hasGuardian;
    private boolean canRegister;   // eligible && (!requiresGuardian || hasGuardian)
    private String blockReason;    // human-readable block reason when canRegister=false

    public static EligibilityResponse noDob() {
        EligibilityResponse r = new EligibilityResponse();
        r.age = -1;
        r.eligible = false;
        r.requiresGuardian = false;
        r.hasGuardian = false;
        r.canRegister = false;
        r.blockReason = "Date of birth not set. Please complete your profile.";
        return r;
    }

    // ── getters / setters ──────────────────────────────────────

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCategoryLabel() { return categoryLabel; }
    public void setCategoryLabel(String categoryLabel) { this.categoryLabel = categoryLabel; }

    public String getAgeRange() { return ageRange; }
    public void setAgeRange(String ageRange) { this.ageRange = ageRange; }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public boolean isRequiresGuardian() { return requiresGuardian; }
    public void setRequiresGuardian(boolean requiresGuardian) { this.requiresGuardian = requiresGuardian; }

    public boolean isHasGuardian() { return hasGuardian; }
    public void setHasGuardian(boolean hasGuardian) { this.hasGuardian = hasGuardian; }

    public boolean isCanRegister() { return canRegister; }
    public void setCanRegister(boolean canRegister) { this.canRegister = canRegister; }

    public String getBlockReason() { return blockReason; }
    public void setBlockReason(String blockReason) { this.blockReason = blockReason; }
}
