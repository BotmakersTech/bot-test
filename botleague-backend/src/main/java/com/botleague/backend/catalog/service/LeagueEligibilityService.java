package com.botleague.backend.catalog.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.catalog.entity.League;
import com.botleague.backend.catalog.repository.LeagueRepository;
import com.botleague.backend.common.utils.EligibilityUtils;

/**
 * Data-driven equivalent of EligibilityUtils, scanning the League catalog
 * instead of a hardcoded 3-value enum — so a newly added league is
 * immediately eligibility-aware without a deploy. Deliberately separate
 * from (not a replacement for) EligibilityUtils, which stays wired into its
 * own Tier-2 callers (Robot eligibility, Ranking pooling, News targeting)
 * exactly as before. Wired only into the two genuinely Tier-1 consumers:
 * SportRegistrationLineupService's registration gate and
 * EligibilityController's /api/eligibility/me.
 */
@Service
public class LeagueEligibilityService {

    private final LeagueRepository leagueRepository;

    public LeagueEligibilityService(LeagueRepository leagueRepository) {
        this.leagueRepository = leagueRepository;
    }

    @Transactional(readOnly = true)
    public Optional<League> findLeagueForAge(int age) {
        List<League> active = leagueRepository.findByStatusOrderByDisplayOrderAsc(League.STATUS_ACTIVE);
        return active.stream().filter(l -> matchesAge(l, age)).findFirst();
    }

    @Transactional(readOnly = true)
    public String findAgeGroupCodeForAge(int age) {
        return findLeagueForAge(age).map(League::getAgeGroupCode).orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean isEligible(LocalDate dob, String ageGroupCode) {
        if (dob == null || ageGroupCode == null) return false;
        int age = EligibilityUtils.calculateAge(dob);
        return ageGroupCode.equalsIgnoreCase(findAgeGroupCodeForAge(age));
    }

    /** Human-readable league name for an age group code, e.g. "Ignite". Falls back to the raw code. */
    @Transactional(readOnly = true)
    public String toLabel(String ageGroupCode) {
        if (ageGroupCode == null) return "Unknown";
        return leagueRepository.findByAgeGroupCode(ageGroupCode).map(League::getName).orElse(ageGroupCode);
    }

    /** e.g. "8–11 yrs" / "18+ yrs". Empty string when the league has no age bounds configured. */
    @Transactional(readOnly = true)
    public String toAgeRangeLabel(String ageGroupCode) {
        if (ageGroupCode == null) return "";
        return leagueRepository.findByAgeGroupCode(ageGroupCode).map(this::formatRange).orElse("");
    }

    /** Lowest minAge among ACTIVE leagues — the "you're too young" cutoff. Falls back to 8. */
    @Transactional(readOnly = true)
    public int minEligibleAge() {
        return leagueRepository.findByStatusOrderByDisplayOrderAsc(League.STATUS_ACTIVE).stream()
                .map(League::getMinAge)
                .filter(Objects::nonNull)
                .min(Integer::compareTo)
                .orElse(EligibilityUtils.JUNIOR_MIN);
    }

    private boolean matchesAge(League league, int age) {
        Integer min = league.getMinAge();
        Integer max = league.getMaxAge();
        if (min != null && age < min) return false;
        if (max != null && age > max) return false;
        return true;
    }

    private String formatRange(League league) {
        Integer min = league.getMinAge();
        Integer max = league.getMaxAge();
        if (min == null && max == null) return "";
        if (max == null) return min + "+ yrs";
        if (min == null) return "up to " + max + " yrs";
        return min + "–" + max + " yrs";
    }
}
