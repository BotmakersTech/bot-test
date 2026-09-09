package com.botleague.backend.events.service;

/**
 * The one place that answers "which weight class is this string?".
 *
 * <p>Same two-naming-worlds problem {@link SportKeys} solves for the sport
 * name, in the column right next to it. A weight class arrives as:
 * <ul>
 *   <li>the catalog's own label stored on EventSports — {@code "60kg"}, {@code "1.5kg"}</li>
 *   <li>the legacy code robots persist — {@code "60KG"}, {@code "1_5KG"}</li>
 *   <li>anything an organiser typed by hand — {@code "60 KG"}</li>
 * </ul>
 *
 * <p>Left unfolded these split one real weight class into several ranking
 * pools — a live pool list held {@code ROBOSOCCER/5KG} and {@code
 * ROBOSOCCER/5kg} as two separate rankings of the same 5 kg class, and the
 * rankings page (which asks in the legacy code shape) could not see a pool
 * stored in the catalog shape at all.
 *
 * <p>Canonical form is the legacy code shape, because that is what
 * WEIGHT_CLASS_LABELS is keyed on and what the frontend already derives from
 * a catalog weight: {@code 60 -> "60KG"}, {@code 1.5 -> "1_5KG"}.
 */
public final class WeightClassKeys {

    private WeightClassKeys() {}

    /**
     * Fold any weight-class spelling down to one canonical code.
     *
     * <p>A class with no number in it at all ("Open", "Featherweight") has no
     * canonical code to fold to, so it comes back trimmed and upper-cased —
     * still comparing equal to itself, never colliding with a real class.
     * Null and blank stay as they are: a sport with no weight-class concept
     * (Drone Soccer, RC by scale) must keep ranking as one pool.
     */
    public static String of(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty()) return s;

        // First number in the string, with . _ or , as the decimal separator —
        // the same shape weightClassToKg() parses on the frontend.
        java.util.regex.Matcher m =
                java.util.regex.Pattern.compile("(\\d+)(?:[._,](\\d+))?").matcher(s);
        if (!m.find()) return s.toUpperCase();

        String whole = m.group(1);
        String frac  = m.group(2);
        if (frac == null) return whole + "KG";

        // Trailing zeros carry no meaning here ("1.50kg" is the 1.5 kg class),
        // and leaving them in would split it from "1_5KG".
        String trimmed = frac.replaceAll("0+$", "");
        return trimmed.isEmpty() ? whole + "KG" : whole + "_" + trimmed + "KG";
    }
}
