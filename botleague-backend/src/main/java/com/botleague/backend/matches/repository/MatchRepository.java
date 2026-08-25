package com.botleague.backend.matches.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.enums.MatchStatus;

@Repository
public interface MatchRepository
        extends JpaRepository<Match, UUID> {

    // EVENT SPORT

    List<Match>
    findByEventSportIdAndDeletedAtIsNull(
            UUID eventSportId
    );

    // Sport-wide judge scoring grant resolution (getMyMatchesAsJudge) — a
    // judge assigned to a sport can see every match across that sport.
    List<Match>
    findByEventSportIdInAndDeletedAtIsNull(
            List<UUID> eventSportIds
    );

    // Used only to detect "this bracket was soft-deleted and is being
    // regenerated" for the audit trail — the duplicate-generation guard
    // itself only ever looks at non-deleted matches.
    List<Match>
    findByEventSportIdAndDeletedAtIsNotNull(
            UUID eventSportId
    );

    List<Match>
    findByEventSportIdAndDeletedAtIsNullOrderByRoundNumberAscMatchNumberAsc(
            UUID eventSportId
    );

    // ROUND

    List<Match>
    findByEventSportIdAndRoundNumberAndDeletedAtIsNull(
            UUID eventSportId,
            Integer roundNumber
    );

    Match
    findByEventSportIdAndRoundNumberAndMatchNumberAndDeletedAtIsNull(
            UUID eventSportId,
            Integer roundNumber,
            Integer matchNumber
    );

    // STATUS

    List<Match>
    findByEventSportIdAndStatusAndDeletedAtIsNull(
            UUID eventSportId,
            MatchStatus status
    );

    List<Match>
    findByStatusInAndDeletedAtIsNull(
            List<MatchStatus> statuses
    );

    // TEAM MATCHES

    List<Match>
    findByTeamARegistrationIdOrTeamBRegistrationIdAndDeletedAtIsNull(
            UUID teamAId,
            UUID teamBId
    );

    // WINNERS

    List<Match>
    findByWinnerRegistrationIdAndDeletedAtIsNull(
            UUID registrationId
    );

    // BRACKET FLOW

    List<Match>
    findByNextMatchIdAndDeletedAtIsNull(
            UUID nextMatchId
    );

    List<Match>
    findBySourceMatchAIdOrSourceMatchBId(
            UUID sourceMatchAId,
            UUID sourceMatchBId
    );

    // FINAL MATCH

    Match
    findTopByEventSportIdAndDeletedAtIsNullOrderByRoundNumberDescMatchNumberDesc(
            UUID eventSportId
    );

	List<Match> findByEventSportIdAndTeamARegistrationIdOrEventSportIdAndTeamBRegistrationId(UUID eventSportId,
			UUID registrationId, UUID eventSportId2, UUID registrationId2);

	List<Match> findByTeamARegistrationIdOrTeamBRegistrationIdOrTeamCRegistrationIdOrTeamDRegistrationIdAndDeletedAtIsNull(
			UUID registrationId, UUID registrationId2, UUID registrationId3, UUID registrationId4);

	List<Match> findByEventSportIdAndLeaderboardPositionAndDeletedAtIsNull(UUID eventSportId, int i);

    // Efficient query for getMyMatches: finds all non-deleted matches where any
    // registration slot contains one of the supplied IDs. Returns unsorted.
    @org.springframework.data.jpa.repository.Query(
        "SELECT m FROM Match m WHERE m.deletedAt IS NULL AND (" +
        "m.teamARegistrationId IN :regIds OR m.teamBRegistrationId IN :regIds OR " +
        "m.teamCRegistrationId IN :regIds OR m.teamDRegistrationId IN :regIds)")
    List<Match> findByAnyRegistrationIdIn(
        @org.springframework.data.repository.query.Param("regIds") java.util.Collection<UUID> regIds);

    // Matches whose reminder window has arrived (or passed, if a poll cycle
    // was missed — better a late reminder than a silently skipped one) and
    // that haven't been reminded yet. See MatchReminderScheduler.
    @org.springframework.data.jpa.repository.Query(
        "SELECT m FROM Match m WHERE m.deletedAt IS NULL AND m.status = com.botleague.backend.matches.enums.MatchStatus.SCHEDULED " +
        "AND m.reminderSent = false AND m.scheduledAt IS NOT NULL AND m.scheduledAt <= :cutoff")
    List<Match> findDueForReminder(
        @org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff);
}