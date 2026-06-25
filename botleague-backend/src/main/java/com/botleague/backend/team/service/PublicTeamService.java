package com.botleague.backend.team.service;

import java.util.ArrayList;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.ranking.entity.EventLeaderboardEntry;
import com.botleague.backend.ranking.entity.Ranking;
import com.botleague.backend.ranking.repository.EventLeaderboardEntryRepository;
import com.botleague.backend.ranking.repository.RankingRepository;
import com.botleague.backend.team.dto.PublicTeamProfileDTO;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PublicTeamService {

    private final TeamRepository                 teamRepository;
    private final RankingRepository              rankingRepository;
    private final EventLeaderboardEntryRepository leaderboardEntryRepository;
    private final EventRepository                eventRepository;

    public PublicTeamService(
            TeamRepository teamRepository,
            RankingRepository rankingRepository,
            EventLeaderboardEntryRepository leaderboardEntryRepository,
            EventRepository eventRepository) {
        this.teamRepository              = teamRepository;
        this.rankingRepository           = rankingRepository;
        this.leaderboardEntryRepository  = leaderboardEntryRepository;
        this.eventRepository             = eventRepository;
    }

    public PublicTeamProfileDTO getPublicProfile(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> ApiException.notFound("Team not found"));

        PublicTeamProfileDTO dto = new PublicTeamProfileDTO();

        // ── Team identity ─────────────────────────────────────────────────────
        dto.setTeamId(team.getId());
        dto.setTeamCode(team.getTeamCode());
        dto.setTeamName(team.getTeamName());
        dto.setStatus(team.getStatus());
        dto.setLogoUrl(team.getLogoUrl());
        dto.setDescription(team.getDescription());
        dto.setInstitutionName(team.getInstitutionName());
        dto.setCity(team.getCity());
        dto.setState(team.getState());
        dto.setCountry(team.getCountry());

        // ── Global stats — aggregate all Ranking rows for this team ──────────
        List<Ranking> allRankings = rankingRepository.findByTeamId(teamId);

        int totalPoints   = allRankings.stream().mapToInt(Ranking::getTotalPoints).sum();
        int totalWins     = allRankings.stream().mapToInt(Ranking::getWins).sum();
        int totalLosses   = allRankings.stream().mapToInt(Ranking::getLosses).sum();
        int matchesPlayed = allRankings.stream().mapToInt(Ranking::getMatchesPlayed).sum();
        int eventsPlayed  = allRankings.stream().mapToInt(Ranking::getEventsPlayed).sum();
        int gold          = allRankings.stream().mapToInt(Ranking::getGoldMedals).sum();
        int silver        = allRankings.stream().mapToInt(Ranking::getSilverMedals).sum();
        int bronze        = allRankings.stream().mapToInt(Ranking::getBronzeMedals).sum();

        Integer bestRank = allRankings.stream()
                .map(Ranking::getCurrentRank)
                .filter(r -> r != null)
                .min(Comparator.naturalOrder())
                .orElse(null);

        dto.setTotalPoints(totalPoints);
        dto.setTotalWins(totalWins);
        dto.setTotalLosses(totalLosses);
        dto.setMatchesPlayed(matchesPlayed);
        dto.setEventsPlayed(eventsPlayed);
        dto.setBestGlobalRank(bestRank);
        dto.setGoldMedals(gold);
        dto.setSilverMedals(silver);
        dto.setBronzeMedals(bronze);

        // ── Event sport records — one row per event sport participation ───────
        // Use a mutable list so we can sort it in place
        List<EventLeaderboardEntry> entries = new ArrayList<>(
                leaderboardEntryRepository.findByTeamId(teamId));

        List<PublicTeamProfileDTO.EventRecord> records = entries.stream()
                .sorted(Comparator.comparing(EventLeaderboardEntry::getCreatedAt).reversed())
                .map(e -> {
                    PublicTeamProfileDTO.EventRecord rec = new PublicTeamProfileDTO.EventRecord();
                    rec.setEventId(e.getEventId());
                    rec.setEventSportId(e.getEventSportId());
                    rec.setSport(e.getSport());
                    rec.setAgeGroup(e.getAgeGroup());
                    rec.setWeightClass(e.getWeightClass());
                    rec.setEventRank(e.getEventRank());
                    rec.setMatchesPlayed(e.getMatchesPlayed() != null ? e.getMatchesPlayed() : 0);
                    rec.setWins(e.getWins() != null ? e.getWins() : 0);
                    rec.setLosses(e.getLosses() != null ? e.getLosses() : 0);
                    rec.setPointsEarned(e.getPointsEarned() != null ? e.getPointsEarned() : 0);
                    rec.setFinalized(Boolean.TRUE.equals(e.getIsFinalized()));
                    rec.setRobotName(e.getRobotName());
                    // Resolve event name
                    eventRepository.findById(e.getEventId())
                            .ifPresent(ev -> rec.setEventName(ev.getEventName()));
                    return rec;
                })
                .collect(Collectors.toList());

        dto.setEventRecords(records);

        return dto;
    }
}
