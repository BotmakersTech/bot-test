package com.botleague.backend.timetrial.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.MatchFormatKind;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.events.service.MatchFormatPolicy;
import com.botleague.backend.ranking.service.RankingEngineService;
import com.botleague.backend.realtime.enums.RealtimeEventType;
import com.botleague.backend.realtime.service.RealtimePublisher;
import com.botleague.backend.team.repository.TeamRepository;
import com.botleague.backend.timetrial.dto.EntryTimeDTO;
import com.botleague.backend.timetrial.dto.RecordRoundTimesRequestDTO;
import com.botleague.backend.timetrial.dto.RoundEntryResponseDTO;
import com.botleague.backend.timetrial.dto.RoundResponseDTO;
import com.botleague.backend.timetrial.entity.TimeTrialEntry;
import com.botleague.backend.timetrial.entity.TimeTrialRound;
import com.botleague.backend.timetrial.enums.RoundParticipantStatus;
import com.botleague.backend.timetrial.enums.RoundStatus;
import com.botleague.backend.timetrial.repository.TimeTrialEntryRepository;
import com.botleague.backend.timetrial.repository.TimeTrialRoundRepository;

/**
 * Round-wise time trial — the match format for timed-run sports (Robo Race,
 * RC Racing Car, Line Follower — see MatchFormatPolicy), as an alternative to
 * the elimination-bracket system (Match/MatchService) for sports where an
 * arbitrary number of bots run each round and a time, not an opponent, is
 * what determines advancement.
 *
 * Call order:
 *   1. generateFirstRound(eventSportId)  — seeds Round 1 from every REGISTERED SportRegistration
 *   2. recordTimes(roundId, entries)      — staff enters a time or DNF per bot; repeatable
 *   3. shortlist(roundId, cutoffCount)    — locks the round, spawns Round N+1 with advancing bots
 *      ...repeat 2-3 for as many rounds as needed...
 *   4. finalizeRound(roundId)             — locks as FINAL; its ranking becomes final standings
 */
@Service
@Transactional
public class RaceRoundService {

    private static final Logger log = LoggerFactory.getLogger(RaceRoundService.class);

    private final TimeTrialRoundRepository roundRepository;
    private final TimeTrialEntryRepository entryRepository;
    private final EventSportsRepository eventSportsRepository;
    private final SportRegistrationRepository sportRegistrationRepository;
    private final TeamRepository teamRepository;
    private final AuthorizationService authorizationService;
    private final RankingEngineService rankingEngineService;
    private final RealtimePublisher realtimePublisher;

    public RaceRoundService(
            TimeTrialRoundRepository roundRepository,
            TimeTrialEntryRepository entryRepository,
            EventSportsRepository eventSportsRepository,
            SportRegistrationRepository sportRegistrationRepository,
            TeamRepository teamRepository,
            AuthorizationService authorizationService,
            RankingEngineService rankingEngineService,
            RealtimePublisher realtimePublisher) {
        this.roundRepository = roundRepository;
        this.entryRepository = entryRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.teamRepository = teamRepository;
        this.authorizationService = authorizationService;
        this.rankingEngineService = rankingEngineService;
        this.realtimePublisher = realtimePublisher;
    }

    // =====================================================
    // GENERATE ROUND 1
    // =====================================================

    public RoundResponseDTO generateFirstRound(Authentication authentication, UUID eventSportId) {
        UUID callerId = extractUserId(authentication);
        authorizationService.assertCanManageSport(callerId, eventSportId);

        EventSports eventSports = eventSportsRepository.findById(eventSportId)
                .orElseThrow(() -> ApiException.notFound("Event sport not found: " + eventSportId));

        if (MatchFormatPolicy.formatFor(eventSports.getSport()) != MatchFormatKind.ROUND_TIME_TRIAL) {
            throw ApiException.badRequest(
                    "This sport uses the bracket system (Create Match), not round-wise time trial.");
        }

        if (eventSports.getStatus() != SportEventStatus.REGISTRATION_CLOSED) {
            throw ApiException.conflict(
                    "Registration must be closed before generating Round 1. Current status: " + eventSports.getStatus());
        }

        if (roundRepository.existsByEventSportIdAndDeletedAtIsNull(eventSportId)) {
            throw ApiException.conflict("Round 1 has already been generated for this sport.");
        }

        List<SportRegistration> registrations = sportRegistrationRepository
                .findByEventSportIdAndStatus(eventSportId, RegistrationStatus.REGISTERED);

        if (registrations.isEmpty()) {
            throw ApiException.badRequest("No registered bots — nothing to start Round 1 with.");
        }

        TimeTrialRound round = new TimeTrialRound();
        round.setEventSportId(eventSportId);
        round.setRoundNumber(1);
        round.setStatus(RoundStatus.OPEN);
        round.setCreatedBy(callerId);
        round = roundRepository.save(round);

        List<TimeTrialEntry> entries = new ArrayList<>();
        for (SportRegistration reg : registrations) {
            TimeTrialEntry entry = new TimeTrialEntry();
            entry.setRoundId(round.getId());
            entry.setEventSportId(eventSportId);
            entry.setRegistrationId(reg.getId());
            entry.setStatus(RoundParticipantStatus.PENDING);
            entries.add(entry);
        }
        entryRepository.saveAll(entries);

        try {
            rankingEngineService.seedEventLeaderboard(eventSportId);
        } catch (Exception e) {
            log.warn("[RaceRoundService] Leaderboard seed failed for eventSportId={}: {}", eventSportId, e.getMessage());
        }

        RoundResponseDTO dto = mapRound(round);
        realtimePublisher.pushRoundUpdate(eventSportId, RealtimeEventType.ROUND_GENERATED, dto);
        return dto;
    }

    // =====================================================
    // RECORD TIMES
    // =====================================================

    public RoundResponseDTO recordTimes(Authentication authentication, UUID roundId, RecordRoundTimesRequestDTO request) {
        TimeTrialRound round = getEditableRoundOrThrow(authentication, roundId);
        UUID callerId = extractUserId(authentication);

        Map<UUID, TimeTrialEntry> byRegistration = entryRepository.findByRoundId(roundId).stream()
                .collect(Collectors.toMap(TimeTrialEntry::getRegistrationId, e -> e));

        for (EntryTimeDTO update : request.getEntries()) {
            TimeTrialEntry entry = byRegistration.get(update.getRegistrationId());
            if (entry == null) {
                throw ApiException.badRequest(
                        "Registration " + update.getRegistrationId() + " is not part of this round.");
            }

            boolean dnf = Boolean.TRUE.equals(update.getDnf());
            if (dnf) {
                entry.setDnf(true);
                entry.setTimeMillis(null);
                entry.setStatus(RoundParticipantStatus.DNF);
            } else {
                if (update.getTimeMillis() == null) {
                    throw ApiException.badRequest(
                            "Either timeMillis or dnf=true is required for registration " + update.getRegistrationId());
                }
                entry.setDnf(false);
                entry.setTimeMillis(update.getTimeMillis());
                entry.setStatus(RoundParticipantStatus.TIMED);
            }
            entry.setNotes(update.getNotes());
            entry.setRecordedBy(callerId);
            entry.setRecordedAt(LocalDateTime.now());
        }

        List<TimeTrialEntry> allEntries = new ArrayList<>(byRegistration.values());
        assignRanks(allEntries);
        entryRepository.saveAll(allEntries);

        boolean everyEntryDecided = allEntries.stream()
                .noneMatch(e -> e.getStatus() == RoundParticipantStatus.PENDING);
        round.setStatus(everyEntryDecided ? RoundStatus.TIMES_RECORDED : RoundStatus.OPEN);
        round = roundRepository.save(round);

        RoundResponseDTO dto = mapRound(round);
        realtimePublisher.pushRoundUpdate(round.getEventSportId(), RealtimeEventType.ROUND_TIMES_UPDATED, dto);
        return dto;
    }

    // =====================================================
    // SHORTLIST — advance the top N (ties on the boundary all advance)
    // =====================================================

    public RoundResponseDTO shortlist(Authentication authentication, UUID roundId, Integer cutoffCount) {
        TimeTrialRound round = getRoundForStaffOrThrow(authentication, roundId);

        if (round.getStatus() != RoundStatus.TIMES_RECORDED) {
            throw ApiException.conflict(
                    "Every bot needs a time or DNF before shortlisting. Current round status: " + round.getStatus());
        }

        List<TimeTrialEntry> allEntries = entryRepository.findByRoundId(roundId);
        List<TimeTrialEntry> timedAscending = allEntries.stream()
                .filter(e -> e.getStatus() == RoundParticipantStatus.TIMED)
                .sorted((a, b) -> Long.compare(a.getTimeMillis(), b.getTimeMillis()))
                .collect(Collectors.toList());

        if (timedAscending.isEmpty()) {
            throw ApiException.badRequest("No bot recorded a time in this round — nothing to shortlist.");
        }

        int cutoffIndex = Math.min(cutoffCount, timedAscending.size()) - 1;
        long boundaryTime = timedAscending.get(cutoffIndex).getTimeMillis();

        List<TimeTrialEntry> advancing = new ArrayList<>();
        for (TimeTrialEntry entry : allEntries) {
            boolean advances = entry.getStatus() == RoundParticipantStatus.TIMED
                    && entry.getTimeMillis() <= boundaryTime;
            entry.setStatus(advances ? RoundParticipantStatus.ADVANCED : RoundParticipantStatus.ELIMINATED);
            if (advances) advancing.add(entry);
        }
        entryRepository.saveAll(allEntries);

        round.setCutoffCount(cutoffCount);
        round.setActualAdvancedCount(advancing.size());
        round.setStatus(RoundStatus.ADVANCED);
        round = roundRepository.save(round);

        TimeTrialRound nextRound = new TimeTrialRound();
        nextRound.setEventSportId(round.getEventSportId());
        nextRound.setRoundNumber(round.getRoundNumber() + 1);
        nextRound.setStatus(RoundStatus.OPEN);
        nextRound.setCreatedBy(extractUserId(authentication));
        nextRound = roundRepository.save(nextRound);

        List<TimeTrialEntry> nextEntries = new ArrayList<>();
        for (TimeTrialEntry advancedEntry : advancing) {
            TimeTrialEntry next = new TimeTrialEntry();
            next.setRoundId(nextRound.getId());
            next.setEventSportId(round.getEventSportId());
            next.setRegistrationId(advancedEntry.getRegistrationId());
            next.setStatus(RoundParticipantStatus.PENDING);
            nextEntries.add(next);
        }
        entryRepository.saveAll(nextEntries);

        RoundResponseDTO dto = mapRound(round);
        realtimePublisher.pushRoundUpdate(round.getEventSportId(), RealtimeEventType.ROUND_SHORTLISTED, dto);
        return dto;
    }

    // =====================================================
    // FINALIZE — this round's ranking becomes the final standings
    // =====================================================

    public RoundResponseDTO finalizeRound(Authentication authentication, UUID roundId) {
        TimeTrialRound round = getRoundForStaffOrThrow(authentication, roundId);

        if (round.getStatus() != RoundStatus.TIMES_RECORDED) {
            throw ApiException.conflict(
                    "Every bot needs a time or DNF before finalizing. Current round status: " + round.getStatus());
        }

        List<TimeTrialEntry> allEntries = entryRepository.findByRoundId(roundId);
        List<TimeTrialEntry> timedAscending = allEntries.stream()
                .filter(e -> e.getStatus() == RoundParticipantStatus.TIMED)
                .sorted((a, b) -> Long.compare(a.getTimeMillis(), b.getTimeMillis()))
                .collect(Collectors.toList());
        List<TimeTrialEntry> dnfEntries = allEntries.stream()
                .filter(e -> e.getStatus() == RoundParticipantStatus.DNF)
                .collect(Collectors.toList());

        assignRanks(timedAscending);
        // DNF bots share a tied final rank right after every timed finisher —
        // they still get a standing rather than being silently omitted.
        int dnfRank = timedAscending.size() + 1;
        for (TimeTrialEntry e : dnfEntries) e.setRankInRound(dnfRank);

        for (TimeTrialEntry e : allEntries) e.setStatus(RoundParticipantStatus.FINISHED);
        entryRepository.saveAll(allEntries);

        round.setStatus(RoundStatus.FINALIZED);
        round = roundRepository.save(round);

        try {
            Map<UUID, Integer> eventRankByRobotId = new LinkedHashMap<>();
            Map<UUID, UUID> robotIdByRegistration = resolveRobotIds(
                    allEntries.stream().map(TimeTrialEntry::getRegistrationId).collect(Collectors.toList()));
            for (TimeTrialEntry e : allEntries) {
                UUID robotId = robotIdByRegistration.get(e.getRegistrationId());
                if (robotId != null && e.getRankInRound() != null) {
                    eventRankByRobotId.put(robotId, e.getRankInRound());
                }
            }
            rankingEngineService.finalizeRaceLeaderboard(round.getEventSportId(), eventRankByRobotId);

            EventSports eventSports = eventSportsRepository.findById(round.getEventSportId()).orElse(null);
            if (eventSports != null) {
                if (!eventSports.isGlobalRankingsPushed()) {
                    rankingEngineService.pushToGlobalRankings(round.getEventSportId());
                    eventSports.setGlobalRankingsPushed(true);
                    eventSportsRepository.save(eventSports);
                } else {
                    rankingEngineService.fullRecalculate(
                            eventSports.getSport(), eventSports.getAgeGroup(), eventSports.getWeightClass());
                }
            }
        } catch (Exception e) {
            // Fail-open, same philosophy as MatchService's auto-finalize — the
            // round stays FINALIZED with correct round data even if the global
            // ranking push hiccups; it can be retried via the admin ranking tools.
            log.error("[RaceRoundService] Ranking finalize failed for round {}: {}", roundId, e.getMessage());
        }

        RoundResponseDTO dto = mapRound(round);
        realtimePublisher.pushRoundUpdate(round.getEventSportId(), RealtimeEventType.ROUND_FINALIZED, dto);
        return dto;
    }

    // =====================================================
    // DELETE — correction escape hatch for the latest, non-final round only
    // =====================================================

    public void deleteRound(Authentication authentication, UUID roundId) {
        TimeTrialRound round = getRoundForStaffOrThrow(authentication, roundId);

        TimeTrialRound latest = roundRepository
                .findTopByEventSportIdAndDeletedAtIsNullOrderByRoundNumberDesc(round.getEventSportId())
                .orElse(null);
        if (latest == null || !latest.getId().equals(round.getId())) {
            throw ApiException.conflict("Only the most recent round can be deleted.");
        }
        if (round.getStatus() == RoundStatus.FINALIZED || round.getStatus() == RoundStatus.ADVANCED) {
            throw ApiException.conflict(
                    "This round has already been " + round.getStatus() + " and can no longer be deleted.");
        }

        round.setStatus(RoundStatus.CANCELLED);
        round.setDeletedAt(LocalDateTime.now());
        roundRepository.save(round);
    }

    // =====================================================
    // READS
    // =====================================================

    public List<RoundResponseDTO> getRoundsForSport(UUID eventSportId) {
        return roundRepository.findByEventSportIdAndDeletedAtIsNullOrderByRoundNumberAsc(eventSportId).stream()
                .map(this::mapRound)
                .collect(Collectors.toList());
    }

    public RoundResponseDTO getRound(UUID roundId) {
        TimeTrialRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> ApiException.notFound("Round not found: " + roundId));
        return mapRound(round);
    }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================

    private TimeTrialRound getRoundForStaffOrThrow(Authentication authentication, UUID roundId) {
        TimeTrialRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> ApiException.notFound("Round not found: " + roundId));
        authorizationService.assertCanManageSport(extractUserId(authentication), round.getEventSportId());
        return round;
    }

    private TimeTrialRound getEditableRoundOrThrow(Authentication authentication, UUID roundId) {
        TimeTrialRound round = getRoundForStaffOrThrow(authentication, roundId);
        if (round.getStatus() != RoundStatus.OPEN && round.getStatus() != RoundStatus.TIMES_RECORDED) {
            throw ApiException.conflict(
                    "This round is " + round.getStatus() + " and its times can no longer be edited.");
        }
        return round;
    }

    /**
     * Standard competition ranking (1,2,2,4) over the TIMED subset of `entries`.
     * Explicitly nulls out rankInRound on everything else first — otherwise an
     * entry that was TIMED in an earlier recordTimes() call and is now flipped
     * to DNF (staff correcting their own entry before shortlisting) would keep
     * a stale numeric rank from before the change.
     */
    private void assignRanks(List<TimeTrialEntry> entries) {
        for (TimeTrialEntry e : entries) {
            if (e.getStatus() != RoundParticipantStatus.TIMED) e.setRankInRound(null);
        }
        List<TimeTrialEntry> timedAscending = entries.stream()
                .filter(e -> e.getStatus() == RoundParticipantStatus.TIMED && e.getTimeMillis() != null)
                .sorted((a, b) -> Long.compare(a.getTimeMillis(), b.getTimeMillis()))
                .collect(Collectors.toList());
        assignRanksInPlace(timedAscending);
    }

    private void assignRanksInPlace(List<TimeTrialEntry> timedAscending) {
        int rank = 0;
        int position = 0;
        Long lastTime = null;
        for (TimeTrialEntry e : timedAscending) {
            position++;
            if (lastTime == null || !lastTime.equals(e.getTimeMillis())) {
                rank = position;
                lastTime = e.getTimeMillis();
            }
            e.setRankInRound(rank);
        }
    }

    private Map<UUID, UUID> resolveRobotIds(List<UUID> registrationIds) {
        Map<UUID, UUID> result = new HashMap<>();
        for (UUID regId : registrationIds) {
            sportRegistrationRepository.findById(regId)
                    .ifPresent(reg -> result.put(regId, reg.getRobotId()));
        }
        return result;
    }

    private RoundResponseDTO mapRound(TimeTrialRound round) {
        List<TimeTrialEntry> entries = entryRepository.findByRoundId(round.getId());

        RoundResponseDTO dto = new RoundResponseDTO();
        dto.setRoundId(round.getId());
        dto.setEventSportId(round.getEventSportId());
        dto.setRoundNumber(round.getRoundNumber());
        dto.setStatus(round.getStatus().name());
        dto.setCutoffCount(round.getCutoffCount());
        dto.setActualAdvancedCount(round.getActualAdvancedCount());
        dto.setEntries(entries.stream()
                .sorted((a, b) -> {
                    if (a.getRankInRound() == null && b.getRankInRound() == null) return 0;
                    if (a.getRankInRound() == null) return 1;
                    if (b.getRankInRound() == null) return -1;
                    return Integer.compare(a.getRankInRound(), b.getRankInRound());
                })
                .map(this::mapEntry)
                .collect(Collectors.toList()));
        return dto;
    }

    private RoundEntryResponseDTO mapEntry(TimeTrialEntry entry) {
        RoundEntryResponseDTO dto = new RoundEntryResponseDTO();
        dto.setEntryId(entry.getId());
        dto.setRegistrationId(entry.getRegistrationId());
        dto.setTimeMillis(entry.getTimeMillis());
        dto.setDnf(entry.getDnf());
        dto.setStatus(entry.getStatus().name());
        dto.setRankInRound(entry.getRankInRound());
        dto.setNotes(entry.getNotes());

        sportRegistrationRepository.findById(entry.getRegistrationId()).ifPresent(reg -> {
            dto.setRobotName(reg.getRobotName());
            if (reg.getTeamId() != null) {
                teamRepository.findById(reg.getTeamId()).ifPresent(t -> dto.setTeamName(t.getTeamName()));
            }
        });

        return dto;
    }

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}
