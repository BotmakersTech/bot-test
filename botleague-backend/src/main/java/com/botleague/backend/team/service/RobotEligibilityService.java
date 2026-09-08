package com.botleague.backend.team.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.botleague.backend.catalog.entity.League;
import com.botleague.backend.catalog.entity.LeagueSport;
import com.botleague.backend.catalog.entity.Sport;
import com.botleague.backend.catalog.repository.LeagueRepository;
import com.botleague.backend.catalog.repository.LeagueSportRepository;
import com.botleague.backend.catalog.repository.SportRepository;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.events.enums.SpecConstraint;
import com.botleague.backend.events.service.SportKeys;
import com.botleague.backend.events.service.SportSpecPolicy;

/**
 * Derives the leagues a robot may compete in from its sport + physical specs.
 * Age categories are never user-selected; this engine computes them.
 *
 * <p><b>The catalog is the only source of the numbers.</b> This used to be a
 * hardcoded table of per-sport rules written before the League/Sport catalog
 * existed, and it drifted badly: Robo Soccer and Drone Soccer had no Junior
 * Innovators rule even though Ignite runs both (so Ignite robots were computed
 * as Inferno robots and then filtered out of their own competition), and Robo
 * Race had no entry at all (so every Robo Race robot fell back to Junior
 * Innovators regardless of the league it was built for). Reading
 * {@code league_sports} instead means a new league or techsport needs no code
 * change here, and the numbers can never disagree with what the admin sees.
 *
 * <p>Which specs are compared is not a free-for-all either: for each candidate
 * league this asks {@link SportSpecPolicy} what that (league, sport) actually
 * gates on, so a Drone Soccer robot is never judged on weight and an RC Racing
 * Car is never judged on dimensions.
 */
@Service
public class RobotEligibilityService {

    private final LeagueSportRepository leagueSportRepository;
    private final LeagueRepository leagueRepository;
    private final SportRepository sportRepository;

    public RobotEligibilityService(LeagueSportRepository leagueSportRepository,
                                   LeagueRepository leagueRepository,
                                   SportRepository sportRepository) {
        this.leagueSportRepository = leagueSportRepository;
        this.leagueRepository = leagueRepository;
        this.sportRepository = sportRepository;
    }

    /**
     * One catalog row flattened to what eligibility needs: the league it belongs
     * to, the sport's canonical key, and the limits to compare against.
     */
    private record CatalogPair(AgeCategory category, String ageGroupCode, String sportName,
                               String sportKey, Double maxWeightKg,
                               Double maxLengthCm, Double maxWidthCm, Double maxHeightCm,
                               Double diameterCm, String scales) {}

    /**
     * Returns the leagues this robot qualifies for, ordered
     * JUNIOR_INNOVATORS → YOUNG_ENGINEERS → ROBO_MINDS.
     */
    public List<AgeCategory> computeEligibleCategories(
            String sport,
            Double weightKg,
            Double lengthCm,
            Double widthCm,
            Double heightCm) {
        return computeEligibleCategories(sport, weightKg, lengthCm, widthCm, heightCm, null, null);
    }

    /**
     * Full form — {@code diameterCm} and {@code scaleClass} come from
     * Robot.attributes and are the real gate for Drone Soccer and RC Racing Car,
     * which have no weight or dimension limits of their own.
     */
    public List<AgeCategory> computeEligibleCategories(
            String sport,
            Double weightKg,
            Double lengthCm,
            Double widthCm,
            Double heightCm,
            Double diameterCm,
            String scaleClass) {

        String robotKey = SportKeys.of(sport);
        if (robotKey.isEmpty()) return List.of();

        List<AgeCategory> eligible = new ArrayList<>();

        for (CatalogPair pair : catalogPairs()) {
            if (!pair.sportKey().equals(robotKey)) continue;
            if (eligible.contains(pair.category())) continue;

            // Only the spec(s) this (league, sport) actually gates on — the same
            // policy registration itself applies, so the two can't disagree.
            var specs = SportSpecPolicy.constraintsFor(pair.ageGroupCode(), pair.sportName());

            if (specs.contains(SpecConstraint.WEIGHT)
                    && !withinLimit(weightKg, pair.maxWeightKg())) continue;

            if (specs.contains(SpecConstraint.DIMENSION)
                    && !(withinLimit(lengthCm, pair.maxLengthCm())
                      && withinLimit(widthCm,  pair.maxWidthCm())
                      && withinLimit(heightCm, pair.maxHeightCm()))) continue;

            if (specs.contains(SpecConstraint.DIAMETER)
                    && !withinLimit(diameterCm, pair.diameterCm())) continue;

            if (specs.contains(SpecConstraint.SCALE)
                    && !scaleAllowed(scaleClass, pair.scales())) continue;

            eligible.add(pair.category());
        }

        eligible.sort(java.util.Comparator.comparingInt(Enum::ordinal));
        return eligible;
    }

    /** Primary league — the most junior the robot qualifies for, or null if none. */
    public AgeCategory primaryCategory(
            String sport,
            Double weightKg,
            Double lengthCm,
            Double widthCm,
            Double heightCm) {

        List<AgeCategory> list = computeEligibleCategories(sport, weightKg, lengthCm, widthCm, heightCm);
        return list.isEmpty() ? null : list.get(0);
    }

    public AgeCategory primaryCategory(
            String sport,
            Double weightKg,
            Double lengthCm,
            Double widthCm,
            Double heightCm,
            Double diameterCm,
            String scaleClass) {

        List<AgeCategory> list = computeEligibleCategories(
                sport, weightKg, lengthCm, widthCm, heightCm, diameterCm, scaleClass);
        return list.isEmpty() ? null : list.get(0);
    }

    /** Derive the weight-class label from the sport key for RoboWar sports. */
    public static String weightClassFromSport(String sport) {
        return switch (sport) {
            case "ROBOWAR_1_5KG" -> "1.5KG";
            case "ROBOWAR_8KG"   -> "8KG";
            case "ROBOWAR_15KG"  -> "15KG";
            case "ROBOWAR_30KG"  -> "30KG";
            case "ROBOWAR_60KG"  -> "60KG";
            default              -> null;
        };
    }

    // =====================================================
    // CATALOG READ
    // =====================================================

    /**
     * All LIVE catalog pairs, flattened. Fifteen rows that change only when an
     * admin edits the catalog, read on every robot save — cached for the life of
     * the process rather than re-queried each time.
     */
    private volatile List<CatalogPair> cachedPairs;

    /** Drop the cache after a catalog edit. */
    public void invalidateCache() {
        this.cachedPairs = null;
    }

    private List<CatalogPair> catalogPairs() {
        List<CatalogPair> pairs = this.cachedPairs;
        if (pairs != null) return pairs;

        Map<UUID, League> leagues = new HashMap<>();
        leagueRepository.findAll().forEach(l -> leagues.put(l.getId(), l));
        Map<UUID, Sport> sports = new HashMap<>();
        sportRepository.findAll().forEach(s -> sports.put(s.getId(), s));

        List<CatalogPair> built = new ArrayList<>();
        for (LeagueSport ls : leagueSportRepository.findAllByOrderByDisplayOrderAsc()) {
            if (!LeagueSport.STATUS_LIVE.equalsIgnoreCase(ls.getStatus())) continue;

            League league = leagues.get(ls.getLeagueId());
            Sport sport   = sports.get(ls.getSportId());
            if (league == null || sport == null) continue;

            AgeCategory category = parseCategory(league.getAgeGroupCode());
            if (category == null) continue;

            Map<String, String> extra = ls.getExtraSpecs() == null ? Map.of() : ls.getExtraSpecs();

            built.add(new CatalogPair(
                    category,
                    league.getAgeGroupCode(),
                    sport.getName(),
                    SportKeys.of(sport.getName()),
                    // A sport that runs several weight classes admits any robot
                    // up to its largest — the exact class is matched later, at
                    // registration, against the one techsport being entered.
                    heaviestLimitKg(ls),
                    ls.getMaxLengthCm(), ls.getMaxWidthCm(), ls.getMaxHeightCm(),
                    parseDouble(extra.get("diameterCm")),
                    extra.get("scale")
            ));
        }

        this.cachedPairs = built;
        return built;
    }

    /** weightLimitKg, or the largest ceiling among the row's weight classes. */
    private Double heaviestLimitKg(LeagueSport ls) {
        Double limit = ls.getWeightLimitKg();
        String json = ls.getWeightClassesJson();
        if (json == null || json.isBlank()) return limit;

        // weightClassesJson is [{"label":"1.5kg","weightKg":1.5}, ...] — pull the
        // numbers out without pulling in a parser for two fields.
        java.util.regex.Matcher m =
                java.util.regex.Pattern.compile("\"weightKg\"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)").matcher(json);
        Double heaviest = null;
        while (m.find()) {
            Double v = parseDouble(m.group(1));
            if (v != null && (heaviest == null || v > heaviest)) heaviest = v;
        }
        if (heaviest == null) return limit;
        return limit == null ? heaviest : Math.max(limit, heaviest);
    }

    private static AgeCategory parseCategory(String ageGroupCode) {
        if (ageGroupCode == null) return null;
        try {
            return AgeCategory.valueOf(ageGroupCode.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Double parseDouble(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Double.parseDouble(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * A limit of null means the catalog doesn't constrain this spec; a robot
     * value of null means "not recorded" and never disqualifies — the same
     * "informational unless present" rule registration itself uses.
     */
    private boolean withinLimit(Double value, Double limit) {
        return limit == null || value == null || value <= limit;
    }

    /** The catalog's scale is one value or a comma list ("1:8,1:10,1:12"). */
    private boolean scaleAllowed(String robotScale, String allowed) {
        if (allowed == null || allowed.isBlank()) return true;
        if (robotScale == null || robotScale.isBlank()) return true;
        for (String s : allowed.split(",")) {
            if (s.trim().equalsIgnoreCase(robotScale.trim())) return true;
        }
        return false;
    }
}
