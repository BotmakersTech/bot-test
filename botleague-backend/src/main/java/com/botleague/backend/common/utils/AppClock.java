package com.botleague.backend.common.utils;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Registration-window and similar deadline comparisons previously used the
 * server's local clock (LocalDate.now()/LocalDateTime.now()). For an
 * explicitly India-wide platform, a server running in UTC rolls deadlines up
 * to ~5.5 hours early relative to what a competitor in India expects. Use
 * this instead of a bare LocalDate.now() for any registration/eligibility
 * date comparison.
 */
public final class AppClock {

    public static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private AppClock() {}

    public static LocalDate today() {
        return LocalDate.now(INDIA_ZONE);
    }
}
