package com.botleague.backend.certificate.engine;

/**
 * Fixed, code-resolved placeholder catalog — every value here is derived
 * from real platform data (Event/EventSports/Team/Robot/User/CertificateType).
 * There is no user-defined placeholder string; a template's placeholder_map
 * can only reference one of these keys. Scoped to Event and EventSports only
 * — this platform has no Season/Episode concept.
 */
public enum PlaceholderKey {
    PARTICIPANT_NAME(Kind.TEXT),
    TEAM_NAME(Kind.TEXT),
    ROBOT_NAME(Kind.TEXT),
    EVENT_NAME(Kind.TEXT),
    EVENT_SPORT(Kind.TEXT),
    COMPETITION_CATEGORY(Kind.TEXT),
    POSITION(Kind.TEXT),
    RANK(Kind.TEXT),
    INSTITUTE_NAME(Kind.TEXT),
    ORGANIZER_NAME(Kind.TEXT),
    CERTIFICATE_ID(Kind.TEXT),
    DATE(Kind.TEXT),
    VERIFICATION_URL(Kind.TEXT),
    QR_CODE(Kind.IMAGE);

    public enum Kind { TEXT, IMAGE }

    private final Kind kind;

    PlaceholderKey(Kind kind) {
        this.kind = kind;
    }

    public Kind getKind() {
        return kind;
    }
}
