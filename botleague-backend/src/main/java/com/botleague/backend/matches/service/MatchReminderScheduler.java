package com.botleague.backend.matches.service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.matches.entity.Match;
import com.botleague.backend.matches.repository.MatchRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;

/**
 * MATCH_REMINDER existed only as an unused NotificationType value — nothing
 * was watching the clock to actually fire it. This polls every minute for
 * SCHEDULED matches whose scheduledAt has entered the 15-minute reminder
 * window and haven't been reminded yet (Match.reminderSent), notifies every
 * active member of every participating team, and marks the match so it's
 * never sent twice. CRITICAL priority is what makes NotificationService also
 * email it (see NotificationService.maybeSendCriticalEmails) — this is the
 * one notification type where reaching an inbox, not just the in-app bell,
 * actually matters.
 */
@Service
public class MatchReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(MatchReminderScheduler.class);
    private static final int REMINDER_LEAD_MINUTES = 15;

    private final MatchRepository matchRepository;
    private final SportRegistrationRepository sportRegistrationRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final EventSportsRepository eventSportsRepository;
    private final NotificationService notificationService;

    public MatchReminderScheduler(
            MatchRepository matchRepository,
            SportRegistrationRepository sportRegistrationRepository,
            TeamMembershipRepository teamMembershipRepository,
            EventSportsRepository eventSportsRepository,
            NotificationService notificationService) {
        this.matchRepository = matchRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 60_000)
    public void sendDueReminders() {
        LocalDateTime cutoff = LocalDateTime.now().plusMinutes(REMINDER_LEAD_MINUTES);
        List<Match> due = matchRepository.findDueForReminder(cutoff);
        for (Match match : due) {
            try {
                sendReminder(match);
            } catch (Exception e) {
                log.error("Failed to send MATCH_REMINDER for match {}", match.getId(), e);
            }
            // Marked sent even on failure — a stuck match would otherwise
            // retry every minute forever; one missed reminder beats a
            // permanently wedged poll loop for it.
            match.setReminderSent(true);
            matchRepository.save(match);
        }
    }

    void sendReminder(Match match) {
        List<UUID> recipientIds = resolveParticipants(match);
        if (recipientIds.isEmpty()) return;

        String actionUrl = buildActionUrl(match);
        notificationService.notifyUsers(
                recipientIds,
                "Match starting soon",
                "Your match is scheduled to start in about " + REMINDER_LEAD_MINUTES + " minutes.",
                NotificationType.MATCH_REMINDER,
                NotificationPriority.CRITICAL,
                NotificationTargetType.SPORT,
                match.getEventSportId(),
                actionUrl,
                null
        );
    }

    private String buildActionUrl(Match match) {
        EventSports sport = eventSportsRepository.findById(match.getEventSportId()).orElse(null);
        if (sport == null) return null;
        return "/events/" + sport.getEventId() + "/sports/" + sport.getId();
    }

    private List<UUID> resolveParticipants(Match match) {
        Set<UUID> registrationIds = new LinkedHashSet<>();
        addIfPresent(registrationIds, match.getTeamARegistrationId());
        addIfPresent(registrationIds, match.getTeamBRegistrationId());
        addIfPresent(registrationIds, match.getTeamCRegistrationId());
        addIfPresent(registrationIds, match.getTeamDRegistrationId());

        Set<UUID> userIds = new LinkedHashSet<>();
        for (UUID registrationId : registrationIds) {
            SportRegistration reg = sportRegistrationRepository.findById(registrationId).orElse(null);
            if (reg == null || reg.getTeamId() == null) continue;
            teamMembershipRepository.findByTeamIdAndStatus(reg.getTeamId(), TeamMembershipStatus.ACTIVE)
                    .stream()
                    .map(TeamMembership::getUserId)
                    .forEach(userIds::add);
        }
        return userIds.stream().collect(Collectors.toList());
    }

    private void addIfPresent(Set<UUID> set, UUID id) {
        if (id != null) set.add(id);
    }
}
