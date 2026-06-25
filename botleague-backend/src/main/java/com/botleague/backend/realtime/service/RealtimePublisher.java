package com.botleague.backend.realtime.service;

import com.botleague.backend.realtime.dto.RealtimeMessage;
import com.botleague.backend.realtime.enums.RealtimeEventType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Central realtime publisher that wraps {@link SimpMessagingTemplate}.
 *
 * Channel layout:
 *   /user/{userId}/queue/updates       — private per-user messages (notifications, alerts)
 *   /topic/matches/{matchId}           — match score / status changes
 *   /topic/sports/{sportId}            — sport-level updates + match events for that sport
 *   /topic/events/{eventId}            — event-level changes (venue, status)
 *   /topic/registrations/{sportId}     — new registration counts
 *   /topic/rankings/{sportId}          — leaderboard refresh signals
 *   /topic/teams/{teamId}              — team membership changes
 *
 * All publish methods swallow exceptions so that a realtime failure can never
 * roll back or break the primary business transaction.
 */
@Service
public class RealtimePublisher {

    private final SimpMessagingTemplate messaging;

    public RealtimePublisher(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    // ── Low-level primitives ─────────────────────────────────────────────────

    /** Send to a specific user's private queue (/user/{userId}/queue/updates). */
    public void toUser(String userId, RealtimeEventType type, Object payload) {
        try {
            messaging.convertAndSendToUser(userId, "/queue/updates",
                    RealtimeMessage.of(type, payload));
        } catch (Exception ignored) {}
    }

    /** Broadcast to a topic destination. */
    public void toTopic(String destination, RealtimeEventType type, Object payload) {
        try {
            messaging.convertAndSend(destination, RealtimeMessage.of(type, payload));
        } catch (Exception ignored) {}
    }

    // ── Notification ─────────────────────────────────────────────────────────

    /** Push a new notification to the user's private queue. */
    public void pushNotification(UUID userId, Object notificationPayload) {
        toUser(userId.toString(), RealtimeEventType.NOTIFICATION_NEW, notificationPayload);
    }

    // ── Match ─────────────────────────────────────────────────────────────────

    /**
     * Broadcast a match update to the match-specific topic AND to the parent
     * sport topic so spectators watching the sport page also get live scores.
     */
    public void pushMatchUpdate(UUID matchId, UUID eventSportId,
                                RealtimeEventType type, Object payload) {
        toTopic("/topic/matches/" + matchId, type, payload);
        if (eventSportId != null) {
            toTopic("/topic/sports/" + eventSportId, type, payload);
        }
    }

    /**
     * Notify clients that a new bracket was just created for a sport.
     * Clients should re-fetch matches via REST.
     */
    public void pushBracketCreated(UUID eventSportId) {
        toTopic("/topic/sports/" + eventSportId,
                RealtimeEventType.BRACKET_CREATED,
                java.util.Map.of("eventSportId", eventSportId.toString()));
    }

    /**
     * Notify clients that rankings for a sport have changed.
     * Pushes to both the sport topic (consumed by useSportMatchRealtime)
     * and the dedicated rankings topic (for components subscribing directly).
     */
    public void pushRankingsUpdated(UUID eventSportId) {
        java.util.Map<String, String> payload =
                java.util.Map.of("eventSportId", eventSportId.toString());
        toTopic("/topic/sports/" + eventSportId,
                RealtimeEventType.RANKINGS_UPDATED, payload);
        toTopic("/topic/rankings/" + eventSportId,
                RealtimeEventType.RANKINGS_UPDATED, payload);
    }

    // ── Event ─────────────────────────────────────────────────────────────────

    public void pushEventUpdate(UUID eventId, Object payload) {
        toTopic("/topic/events/" + eventId, RealtimeEventType.EVENT_UPDATED, payload);
    }

    public void pushEventStatusChange(UUID eventId, Object payload) {
        toTopic("/topic/events/" + eventId, RealtimeEventType.EVENT_STATUS_CHANGED, payload);
    }

    // ── Sport ─────────────────────────────────────────────────────────────────

    public void pushSportUpdate(UUID sportId, UUID eventId, Object payload) {
        toTopic("/topic/sports/" + sportId, RealtimeEventType.SPORT_UPDATED, payload);
        if (eventId != null) {
            toTopic("/topic/events/" + eventId, RealtimeEventType.SPORT_UPDATED, payload);
        }
    }

    // ── Registration ──────────────────────────────────────────────────────────

    public void pushRegistration(UUID sportId, UUID eventId, Object payload) {
        toTopic("/topic/registrations/" + sportId, RealtimeEventType.REGISTRATION_NEW, payload);
        if (eventId != null) {
            toTopic("/topic/events/" + eventId, RealtimeEventType.REGISTRATION_NEW, payload);
        }
    }

    // ── Team ─────────────────────────────────────────────────────────────────

    public void pushTeamUpdate(UUID teamId, RealtimeEventType type, Object payload) {
        toTopic("/topic/teams/" + teamId, type, payload);
    }
}
