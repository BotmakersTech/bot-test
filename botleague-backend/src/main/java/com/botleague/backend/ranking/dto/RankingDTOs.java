package com.botleague.backend.ranking.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * All ranking-module request / response DTOs in one file.
 */
public final class RankingDTOs {

    private RankingDTOs() {}

    // =========================================================================
    // EVENT LEADERBOARD
    // =========================================================================

    /** One row in the event leaderboard. */
    public static class LeaderboardEntryResponse {
        public int     rank;
        public UUID    robotId;
        public UUID    teamId;
        public String  teamName;
        public String  robotName;
        public int     wins;
        public int     losses;
        public int     matchesPlayed;
        public int     pointsEarned;
        public double  winPercentage;
        public boolean isFinalized;
    }

    /** Full event leaderboard response. */
    public static class EventLeaderboardResponse {
        public UUID                      eventId;
        public UUID                      eventSportId;
        public String                    eventName;
        public String                    sport;
        public String                    ageGroup;
        public String                    weightClass;
        public boolean                   isFinalized;
        public List<LeaderboardEntryResponse> entries;
    }

    // =========================================================================
    // GLOBAL RANKING
    // =========================================================================

    /** One row in the global ranking table. */
    public static class GlobalRankingResponse {
        public int           rank;
        public Integer       previousRank;
        public Integer       rankDelta;          // positive = moved up
        public UUID          robotId;
        public String        robotName;
        public UUID          teamId;
        public String        teamName;
        public String        avatarUrl;
        public String        state;
        public String        city;
        public String        sport;
        public String        ageGroup;
        public String        ageGroupLabel;
        public String        weightClass;
        public int           totalPoints;
        public int           eventsPlayed;
        public int           matchesPlayed;
        public int           wins;
        public int           losses;
        public double        winPercentage;
        public int           goldMedals;
        public int           silverMedals;
        public int           bronzeMedals;
        public UUID          lastEventId;
        public LocalDate     lastEventDate;
        public LocalDateTime lastUpdated;
    }

    /** Paginated global ranking response. */
    public static class GlobalRankingPageResponse {
        public String                     sport;
        public String                     ageGroup;
        public String                     weightClass;
        public long                       total;
        public int                        page;
        public int                        size;
        public List<GlobalRankingResponse> entries;
    }

    // =========================================================================
    // RANKING HISTORY
    // =========================================================================

    public static class RankingHistoryEntry {
        public int           oldRank;
        public int           newRank;
        public int           rankDelta;
        public int           pointsBefore;
        public int           pointsAfter;
        public UUID          triggeredByEventId;
        public LocalDateTime recordedAt;
    }

    public static class TeamRankingHistoryResponse {
        public UUID                     teamId;
        public String                   teamName;
        public String                   sport;
        public String                   ageGroup;
        public String                   weightClass;
        public List<RankingHistoryEntry> history;
    }

    /** The robot-scoped analog of TeamRankingHistoryResponse — the primary history view. */
    public static class RobotRankingHistoryResponse {
        public UUID                     robotId;
        public String                   robotName;
        public String                   sport;
        public String                   ageGroup;
        public String                   weightClass;
        public List<RankingHistoryEntry> history;
    }

    // =========================================================================
    // POINT TRANSACTIONS
    // =========================================================================

    public static class PointTransactionResponse {
        public UUID          robotId;
        public UUID          teamId;
        public UUID          matchId;
        public UUID          eventId;
        public String        sport;
        public String        ageGroup;
        public String        weightClass;
        public String        roundType;
        public boolean       isWinner;
        public int           pointsAwarded;
        public boolean       isVoided;
        public LocalDateTime createdAt;
    }

    public static class TeamPointBreakdownResponse {
        public UUID                           teamId;
        public String                         teamName;
        public String                         sport;
        public String                         ageGroup;
        public String                         weightClass;
        public int                            totalPoints;
        public List<EventPointSummary>        byEvent;
        public List<PointTransactionResponse> transactions;
    }

    /** The robot-scoped analog of TeamPointBreakdownResponse — the primary breakdown view. */
    public static class RobotPointBreakdownResponse {
        public UUID                           robotId;
        public String                         robotName;
        public String                         sport;
        public String                         ageGroup;
        public String                         weightClass;
        public int                            totalPoints;
        public List<EventPointSummary>        byEvent;
        public List<PointTransactionResponse> transactions;
    }

    public static class EventPointSummary {
        public UUID    eventId;
        public String  eventName;
        public int     pointsEarned;
        public int     wins;
        public int     losses;
        public Integer eventRank;
    }

    // =========================================================================
    // RECALCULATION REQUEST
    // =========================================================================

    public static class RecalculateRequest {
        public String  sport;
        public String  ageGroup;
        public String  weightClass;
        public boolean force;   // if true, recompute from scratch via all transactions
    }
}
