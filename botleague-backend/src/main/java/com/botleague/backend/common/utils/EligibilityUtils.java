package com.botleague.backend.common.utils;

import java.time.LocalDate;
import java.time.Period;

import com.botleague.backend.events.enums.AgeCategory;

public final class EligibilityUtils {

    /** Age 8–11 → Junior Innovators */
    public static final int JUNIOR_MIN = 8;
    public static final int JUNIOR_MAX = 11;

    /** Age 12–17 → Young Engineers */
    public static final int YOUNG_MIN = 12;
    public static final int YOUNG_MAX = 17;

    /** Age 18+ → Robo Minds */
    public static final int ROBO_MIN = 18;

    private EligibilityUtils() {}

    public static int calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) return -1;
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }

    /** Returns null when the age is below the minimum (< 8). */
    public static AgeCategory getCategoryForAge(int age) {
        if (age >= JUNIOR_MIN && age <= JUNIOR_MAX) return AgeCategory.JUNIOR_INNOVATORS;
        if (age >= YOUNG_MIN  && age <= YOUNG_MAX)  return AgeCategory.YOUNG_ENGINEERS;
        if (age >= ROBO_MIN)                         return AgeCategory.ROBO_MINDS;
        return null;
    }

    public static AgeCategory getCategoryFromDob(LocalDate dob) {
        if (dob == null) return null;
        return getCategoryForAge(calculateAge(dob));
    }

    public static boolean isEligible(LocalDate dob, AgeCategory required) {
        if (dob == null || required == null) return false;
        return required.equals(getCategoryFromDob(dob));
    }

    /** Under-18 participants must provide guardian info before registering. */
    public static boolean requiresGuardian(LocalDate dob) {
        if (dob == null) return false;
        int age = calculateAge(dob);
        return age >= 0 && age < 18;
    }

    public static String toCategoryLabel(AgeCategory cat) {
        if (cat == null) return "Unknown";
        return switch (cat) {
            case JUNIOR_INNOVATORS -> "Junior Innovators";
            case YOUNG_ENGINEERS   -> "Young Engineers";
            case ROBO_MINDS        -> "Robo Minds";
        };
    }

    public static String toCategoryAgeRange(AgeCategory cat) {
        if (cat == null) return "";
        return switch (cat) {
            case JUNIOR_INNOVATORS -> "8–11 yrs";
            case YOUNG_ENGINEERS   -> "12–17 yrs";
            case ROBO_MINDS        -> "18+ yrs";
        };
    }
}
