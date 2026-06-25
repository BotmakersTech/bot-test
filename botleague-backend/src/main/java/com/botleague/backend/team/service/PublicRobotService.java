package com.botleague.backend.team.service;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.ranking.entity.EventLeaderboardEntry;
import com.botleague.backend.ranking.repository.EventLeaderboardEntryRepository;
import com.botleague.backend.team.dto.PublicRobotProfileDTO;
import com.botleague.backend.team.entity.Robot;
import com.botleague.backend.team.repository.RobotMediaRepository;
import com.botleague.backend.team.repository.RobotRepository;
import com.botleague.backend.team.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PublicRobotService {

    private final RobotRepository                robotRepository;
    private final RobotMediaRepository           robotMediaRepository;
    private final TeamRepository                 teamRepository;
    private final SportRegistrationRepository    sportRegistrationRepository;
    private final EventLeaderboardEntryRepository leaderboardEntryRepository;
    private final EventRepository                eventRepository;
    private final EventSportsRepository          eventSportsRepository;

    public PublicRobotService(
            RobotRepository robotRepository,
            RobotMediaRepository robotMediaRepository,
            TeamRepository teamRepository,
            SportRegistrationRepository sportRegistrationRepository,
            EventLeaderboardEntryRepository leaderboardEntryRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository) {
        this.robotRepository             = robotRepository;
        this.robotMediaRepository        = robotMediaRepository;
        this.teamRepository              = teamRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.leaderboardEntryRepository  = leaderboardEntryRepository;
        this.eventRepository             = eventRepository;
        this.eventSportsRepository       = eventSportsRepository;
    }

    public PublicRobotProfileDTO getPublicProfile(UUID robotId) {
        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));

        PublicRobotProfileDTO dto = new PublicRobotProfileDTO();

        // ── Robot identity ────────────────────────────────────────────────────
        dto.setRobotId(robot.getId());
        dto.setRobotCode(robot.getRobotCode());
        dto.setRobotName(robot.getRobotName());
        dto.setDescription(robot.getDescription());
        dto.setStatus(robot.getStatus() != null ? robot.getStatus().name() : null);

        // Primary image (most recent)
        robotMediaRepository.findTopByRobotIdOrderByCreatedAtDesc(robot.getId())
                .ifPresent(m -> dto.setImageUrl(m.getFileUrl()));

        // ── Specs ─────────────────────────────────────────────────────────────
        dto.setRobotType(robot.getRobotType() != null ? robot.getRobotType().name() : null);
        dto.setSport(robot.getSport());
        dto.setAgeCategory(robot.getAgeCategory() != null ? robot.getAgeCategory().name() : null);
        dto.setControlType(robot.getControlType() != null ? robot.getControlType().name() : null);
        dto.setControlMode(robot.getControlMode() != null ? robot.getControlMode().name() : null);
        dto.setWeightClass(robot.getWeightClass());
        dto.setWeightKg(robot.getWeightKg());
        dto.setLengthCm(robot.getLengthCm());
        dto.setWidthCm(robot.getWidthCm());
        dto.setHeightCm(robot.getHeightCm());

        // ── Team ──────────────────────────────────────────────────────────────
        dto.setTeamId(robot.getTeamId());
        if (robot.getTeamId() != null) {
            teamRepository.findById(robot.getTeamId()).ifPresent(t -> {
                dto.setTeamName(t.getTeamName());
                dto.setTeamCode(t.getTeamCode());
                dto.setTeamLogoUrl(t.getLogoUrl());
            });
        }

        // ── Tournament records — via SportRegistration ────────────────────────
        List<SportRegistration> regs = sportRegistrationRepository.findByRobotId(robot.getId());

        List<PublicRobotProfileDTO.TournamentRecord> records = new ArrayList<>();
        int totalMatches = 0, totalWins = 0, totalLosses = 0, totalPoints = 0;
        int gold = 0, silver = 0, bronze = 0;

        for (SportRegistration reg : regs) {
            // Lookup leaderboard entry for this robot's team in this sport
            leaderboardEntryRepository
                    .findByEventSportIdAndTeamId(reg.getEventSportId(), reg.getTeamId())
                    .ifPresent(lb -> {
                        PublicRobotProfileDTO.TournamentRecord rec = new PublicRobotProfileDTO.TournamentRecord();
                        rec.setEventSportId(lb.getEventSportId());
                        rec.setEventId(lb.getEventId());
                        rec.setSport(lb.getSport());
                        rec.setAgeGroup(lb.getAgeGroup());
                        rec.setWeightClass(lb.getWeightClass());
                        rec.setEventRank(lb.getEventRank());
                        rec.setMatchesPlayed(lb.getMatchesPlayed() != null ? lb.getMatchesPlayed() : 0);
                        rec.setWins(lb.getWins() != null ? lb.getWins() : 0);
                        rec.setLosses(lb.getLosses() != null ? lb.getLosses() : 0);
                        rec.setPointsEarned(lb.getPointsEarned() != null ? lb.getPointsEarned() : 0);
                        rec.setFinalized(Boolean.TRUE.equals(lb.getIsFinalized()));
                        // Resolve event name
                        eventRepository.findById(lb.getEventId())
                                .ifPresent(ev -> rec.setEventName(ev.getEventName()));
                        records.add(rec);
                    });
        }

        // Aggregate career totals from records
        for (PublicRobotProfileDTO.TournamentRecord rec : records) {
            totalMatches += rec.getMatchesPlayed();
            totalWins    += rec.getWins();
            totalLosses  += rec.getLosses();
            totalPoints  += rec.getPointsEarned();
            if (Integer.valueOf(1).equals(rec.getEventRank()))      gold++;
            else if (Integer.valueOf(2).equals(rec.getEventRank())) silver++;
            else if (Integer.valueOf(3).equals(rec.getEventRank())) bronze++;
        }

        dto.setEventsPlayed(records.size());
        dto.setTotalMatches(totalMatches);
        dto.setTotalWins(totalWins);
        dto.setTotalLosses(totalLosses);
        dto.setTotalPoints(totalPoints);
        dto.setGoldMedals(gold);
        dto.setSilverMedals(silver);
        dto.setBronzeMedals(bronze);

        // Sort newest first (by eventId as proxy when createdAt isn't on leaderboard)
        records.sort(Comparator.comparing(
                (PublicRobotProfileDTO.TournamentRecord r) -> r.getEventId().toString()).reversed());
        dto.setRecords(records);

        return dto;
    }
}
