package com.botleague.backend.events.service;

/**
 * The one place that answers "which real sport is this string?".
 *
 * <p>A sport arrives here in three different shapes and all of them have to
 * resolve to the same answer:
 * <ul>
 *   <li>the catalog display name stored on EventSports — {@code "Robo War"}, {@code "RC Racing Car"}</li>
 *   <li>a legacy per-weight-class key stored on Robot — {@code "ROBOWAR_1_5KG"}</li>
 *   <li>a canonical token from before the catalog — {@code "ROBO_WAR"}, {@code "ROBO_WAR_OPEN"}</li>
 * </ul>
 *
 * <p>Both naming worlds are live in the same column today (event_sports.sport
 * holds {@code "ROBO_SUMO"} and {@code "Robo Sumo"} side by side), which is why
 * every attempt to match sports with a hand-maintained name-to-name allowlist
 * has drifted and silently broken registration — first RC Racing Car, then
 * Drone Soccer. Folding both sides to a bucket can't drift: a name nobody
 * anticipated still lands in a bucket, and two spellings of the same sport land
 * in the same one.
 *
 * <p>Order matters in {@link #of(String)}: the broad fallbacks ("…SOCCER",
 * "…RACE") must come after every specific sport that contains those words, or
 * Drone Soccer would be swallowed by Robo Soccer and RC Racing by Robo Race.
 */
public final class SportKeys {

    private SportKeys() {}

    /** Canonical bucket for a catalog sport that has no event of its own yet. */
    public static final String ROBO_WAR       = "ROBOWAR";
    public static final String ROBO_SUMO      = "ROBOSUMO";
    public static final String ROBO_RACE      = "ROBORACE";
    public static final String ROBO_SOCCER    = "ROBOSOCCER";
    public static final String DRONE_SOCCER   = "DRONESOCCER";
    public static final String LINE_FOLLOWER  = "LINEFOLLOWER";
    public static final String RC_RACING_CAR  = "RCRACINGCAR";

    /** UPPER, digits kept, every run of non-alphanumerics dropped. */
    public static String norm(String s) {
        return s == null ? "" : s.toUpperCase().replaceAll("[^A-Z0-9]+", "");
    }

    /**
     * Fold any sport identifier down to one canonical key.
     *
     * <p>Returns the normalised input unchanged when nothing matches, so a
     * custom or retired sport still compares equal to itself rather than
     * colliding with a real one.
     */
    public static String of(String sportName) {
        String n = norm(sportName);
        if (n.isEmpty()) return "";

        // Legacy, non-catalog sports first: each contains a word a broader rule
        // below would otherwise claim ("PLUG_N_PLAY_SOCCER" is not Robo Soccer,
        // "DRONE_RACING" is not Robo Race).
        if (n.contains("PLUGNPLAY"))    return "PLUGNPLAY";
        if (n.contains("THEMEBASED"))   return "THEMEBASED";
        if (n.contains("MANUALTASK"))   return "MANUALTASK";
        if (n.contains("AEROMODELLING")) return "AEROMODELLING";
        if (n.contains("PROJECTBASED")) return "PROJECTBASED";

        if (n.contains("ROBOWAR") || n.contains("ROBOTWAR") || n.contains("COMBAT")) return ROBO_WAR;
        if (n.contains("ROBOSUMO") || n.contains("SUMO")) return ROBO_SUMO;
        if (n.contains("LINEFOLLOWER") || n.contains("LINEFOLLOW")) return LINE_FOLLOWER;
        if (n.contains("DRONESOCCER") || n.contains("DRONE")) return DRONE_SOCCER;
        if (n.contains("RCRACING") || n.contains("RCROBO") || n.contains("RCCAR")) return RC_RACING_CAR;
        if (n.contains("ROBOSOCCER") || n.contains("SOCCER")) return ROBO_SOCCER;
        // "Robo Race" / "Robo Racing" — last, so "RC Racing" is matched above.
        if (n.contains("ROBORACE") || n.contains("ROBORACING") || n.contains("RACE")) return ROBO_RACE;
        return n;
    }

    /** True when both identifiers name the same real sport, whatever their spelling. */
    public static boolean sameSport(String a, String b) {
        String ka = of(a);
        String kb = of(b);
        return !ka.isEmpty() && ka.equals(kb);
    }
}
