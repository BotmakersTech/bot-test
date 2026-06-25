package com.botleague.backend.matches.service;

import com.botleague.backend.achievement.enums.AchievementType;
import com.botleague.backend.achievement.service.AchievementService;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TournamentNotificationService {

    private final NotificationService notificationService;
    private final ChatService chatService;
    private final AchievementService achievementService;
    private final SportRegistrationRepository sportRegistrationRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final MatchRepository matchRepository;

    public TournamentNotificationService(
            NotificationService notificationService,
            ChatService chatService,
            AchievementService achievementService,
            SportRegistrationRepository sportRegistrationRepository,
            TeamMembershipRepository teamMembershipRepository,
            MatchRepository matchRepository) {
        this.notificationService = notificationService;
        this.chatService = chatService;
        this.achievementService = achievementService;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.matchRepository = matchRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC HOOKS
    // ─────────────────────────────────────────────────────────────────────────

    public void onBracketCreated(UUID eventSportId, String sportName) {
        notificationService.systemNotify(
            "Tournament Bracket Released!",
            "The bracket for " + sportName + " has been released. Check your matches!",
            NotificationType.MATCH_SCHEDULED,
            NotificationPriority.HIGH,
            NotificationTargetType.SPORT,
            eventSportId,
            "/events"
        );
    }

    public void onMatchStarted(Match match) {
        notifyMatchRegistrations(match,
            "Match Starting Now!",
            "Your match is starting. Get ready!",
            NotificationType.MATCH_STARTED,
            NotificationPriority.HIGH);
        createMatchRoomIfReady(match);
    }

    public void onMatchCompleted(Match match) {
        notifyMatchRegistrations(match,
            "Match Result Published",
            "The result for your match has been published. Check the leaderboard!",
            NotificationType.RESULT_PUBLISHED,
            NotificationPriority.HIGH);
    }

    public void onWinnerAdvanced(Match completedMatch, Match nextMatch, UUID eventSportId, int totalRoundsInBracket) {
        UUID winnerRegId = completedMatch.getWinnerRegistrationId();
        if (winnerRegId == null) return;

        int nextRound = nextMatch.getRoundNumber() != null ? nextMatch.getRoundNumber() : 0;
        String progressionMsg = getProgressionMessage(nextRound, totalRoundsInBracket);
        if (progressionMsg != null) {
            String[] parts = progressionMsg.split("\\|");
            notifyRegistration(winnerRegId, parts[0], parts[1],
                getProgressionType(nextRound, totalRoundsInBracket), NotificationPriority.HIGH);
        }

        createMatchRoomIfReady(nextMatch);
    }

    public void onTournamentWinner(Match match, UUID eventSportId) {
        UUID winnerId = match.getWinnerRegistrationId();
        if (winnerId == null) return;

        notifyRegistration(winnerId,
            "CHAMPIONS!",
            "Your team won the tournament. You are the champions!",
            NotificationType.TOURNAMENT_WINNER,
            NotificationPriority.HIGH);

        UUID runnerUpId = resolveRunnerUp(match);
        if (runnerUpId != null) {
            notifyRegistration(runnerUpId,
                "Runner-Up",
                "Great performance! Your team finished as Runner-Up.",
                NotificationType.RUNNER_UP,
                NotificationPriority.HIGH);
        }

        unlockAchievement(winnerId, eventSportId, AchievementType.CHAMPION);
        if (runnerUpId != null) {
            unlockAchievement(runnerUpId, eventSportId, AchievementType.RUNNER_UP);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private void notifyMatchRegistrations(Match match, String title, String msg,
                                          NotificationType type, NotificationPriority priority) {
        for (UUID regId : presentRegistrations(match)) {
            notifyRegistration(regId, title, msg, type, priority);
        }
    }

    private void notifyRegistration(UUID registrationId, String title, String msg,
                                    NotificationType type, NotificationPriority priority) {
        sportRegistrationRepository.findById(registrationId).ifPresent(reg -> {
            if (reg.getTeamId() != null) {
                notificationService.systemNotify(title, msg, type, priority,
                    NotificationTargetType.TEAM, reg.getTeamId(), null);
            }
        });
    }

    private List<UUID> presentRegistrations(Match match) {
        List<UUID> ids = new ArrayList<>();
        if (match.getTeamARegistrationId() != null) ids.add(match.getTeamARegistrationId());
        if (match.getTeamBRegistrationId() != null) ids.add(match.getTeamBRegistrationId());
        if (match.getTeamCRegistrationId() != null) ids.add(match.getTeamCRegistrationId());
        if (match.getTeamDRegistrationId() != null) ids.add(match.getTeamDRegistrationId());
        return ids;
    }

    private void createMatchRoomIfReady(Match match) {
        List<UUID> regIds = presentRegistrations(match);
        if (regIds.size() < 2) return;

        // Resolve all active team member user IDs from the registrations
        List<UUID> memberUserIds = regIds.stream()
            .flatMap(regId -> sportRegistrationRepository.findById(regId)
                .filter(reg -> reg.getTeamId() != null)
                .map(reg -> teamMembershipRepository
                    .findByTeamIdAndStatus(reg.getTeamId(), TeamMembershipStatus.ACTIVE)
                    .stream()
                    .map(m -> m.getUserId())
                    .collect(Collectors.toList()))
                .orElse(List.of())
                .stream())
            .distinct()
            .collect(Collectors.toList());

        chatService.createMatchRoom(match.getId(), match.getRoundNumber(), memberUserIds);
    }

    private void unlockAchievement(UUID registrationId, UUID eventSportId, AchievementType type) {
        sportRegistrationRepository.findById(registrationId).ifPresent(reg -> {
            if (reg.getTeamId() != null) {
                teamMembershipRepository
                    .findByTeamIdAndStatus(reg.getTeamId(), TeamMembershipStatus.ACTIVE)
                    .forEach(m -> achievementService.unlock(m.getUserId(), eventSportId, type));
            }
        });
    }

    private String getProgressionMessage(int nextRound, int totalRounds) {
        if (nextRound == totalRounds) return "YOU ARE IN THE FINALS!|Prepare for the championship battle.";
        if (nextRound == totalRounds - 1) return "Semi Finals!|Your team has reached the Semi Finals.";
        if (nextRound == totalRounds - 2) return "Quarter Finals!|Your team has qualified for the Quarter Finals.";
        return "You Advanced!|Your team is through to round " + nextRound + ". Keep it up!";
    }

    private NotificationType getProgressionType(int nextRound, int totalRounds) {
        if (nextRound == totalRounds) return NotificationType.QUALIFIED_FINAL;
        if (nextRound == totalRounds - 1) return NotificationType.QUALIFIED_SF;
        return NotificationType.QUALIFIED_QF;
    }

    private UUID resolveRunnerUp(Match match) {
        UUID winner = match.getWinnerRegistrationId();
        if (winner == null) return null;
        // For multi-team finals, positionSecondRegistrationId is the explicit runner-up.
        if (match.getPositionSecondRegistrationId() != null
                && !match.getPositionSecondRegistrationId().equals(winner)) {
            return match.getPositionSecondRegistrationId();
        }
        // ONE_VS_ONE fallback: the non-winner slot.
        if (match.getTeamARegistrationId() != null && !match.getTeamARegistrationId().equals(winner))
            return match.getTeamARegistrationId();
        if (match.getTeamBRegistrationId() != null && !match.getTeamBRegistrationId().equals(winner))
            return match.getTeamBRegistrationId();
        return null;
    }
}
