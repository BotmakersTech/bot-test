package com.botleague.backend.notification.service;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.notification.dto.CreateNotificationRequest;
import com.botleague.backend.notification.dto.NotificationResponse;
import com.botleague.backend.notification.entity.Notification;
import com.botleague.backend.notification.entity.NotificationRecipient;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.repository.NotificationRecipientRepository;
import com.botleague.backend.notification.repository.NotificationRepository;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.realtime.service.RealtimePublisher;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository recipientRepository;
    private final UserRepository userRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final EventSportsRepository eventSportsRepository;
    private final SportRegistrationRepository sportRegistrationRepository;
    private final RealtimePublisher realtimePublisher;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationRecipientRepository recipientRepository,
            UserRepository userRepository,
            TeamMembershipRepository teamMembershipRepository,
            EventSportsRepository eventSportsRepository,
            SportRegistrationRepository sportRegistrationRepository,
            RealtimePublisher realtimePublisher) {
        this.notificationRepository = notificationRepository;
        this.recipientRepository = recipientRepository;
        this.userRepository = userRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.realtimePublisher = realtimePublisher;
    }

    /**
     * Send a notification to all active members of a team, excluding the actor.
     * Used for captain-initiated actions (robot management, role changes, etc.)
     * so that the actor does not receive their own notification.
     */
    public void teamNotifyExcluding(
            UUID teamId,
            UUID actorUserId,
            String title,
            String message,
            NotificationType type,
            NotificationPriority priority,
            String actionUrl) {

        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setPriority(priority);
        notification.setTargetType(NotificationTargetType.TEAM);
        notification.setTargetId(teamId);
        notification.setActionUrl(actionUrl);
        notification.setCustom(false);
        notification.setCreatedBy(actorUserId);
        notification.setCreatedAt(LocalDateTime.now());
        Notification saved = notificationRepository.save(notification);

        List<UUID> recipientIds = teamMembershipRepository
                .findByTeamIdAndStatus(teamId, TeamMembershipStatus.ACTIVE)
                .stream()
                .map(TeamMembership::getUserId)
                .filter(id -> !id.equals(actorUserId))
                .collect(Collectors.toList());

        List<NotificationRecipient> recipients = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (UUID userId : recipientIds) {
            NotificationRecipient r = new NotificationRecipient();
            r.setNotificationId(saved.getId());
            r.setUserId(userId);
            r.setRead(false);
            r.setDeliveredAt(now);
            r.setCreatedAt(now);
            recipients.add(r);
        }
        recipientRepository.saveAll(recipients);

        NotificationResponse payload = toResponseNoRecipient(saved);
        for (UUID userId : recipientIds) {
            realtimePublisher.pushNotification(userId, payload);
        }
    }

    /**
     * Convenience method for system-generated (automatic) notifications.
     * createdBy is null — these are fired by the system, not a specific user.
     */
    public void systemNotify(
            String title,
            String message,
            NotificationType type,
            NotificationPriority priority,
            NotificationTargetType targetType,
            UUID targetId,
            String actionUrl
    ) {
        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setTitle(title);
        req.setMessage(message);
        req.setType(type.name());
        req.setPriority(priority.name());
        req.setTargetType(targetType.name());
        req.setTargetId(targetId);
        req.setActionUrl(actionUrl);
        dispatch(req, null);
    }

    /**
     * Create and immediately dispatch a notification.
     * Resolves recipients based on targetType and saves NotificationRecipient rows.
     */
    public NotificationResponse dispatch(CreateNotificationRequest req, UUID createdBy) {
        // 1. Build and save Notification entity
        Notification notification = new Notification();
        notification.setTitle(req.getTitle());
        notification.setMessage(req.getMessage());
        notification.setType(NotificationType.valueOf(req.getType()));
        notification.setPriority(NotificationPriority.valueOf(req.getPriority()));
        NotificationTargetType targetType = NotificationTargetType.valueOf(req.getTargetType());
        notification.setTargetType(targetType);
        notification.setTargetId(req.getTargetId());
        notification.setActionUrl(req.getActionUrl());
        notification.setCustom(
                req.getType().startsWith("CUSTOM_")
        );
        notification.setCreatedBy(createdBy);
        notification.setCreatedAt(LocalDateTime.now());
        Notification saved = notificationRepository.save(notification);

        // 2. Resolve recipient user IDs (deduplicated)
        List<UUID> recipientIds = resolveRecipients(targetType, req.getTargetId());
        Set<UUID> uniqueIds = new LinkedHashSet<>(recipientIds);

        // 3. Save NotificationRecipient for each unique user ID
        List<NotificationRecipient> recipients = new ArrayList<>();
        for (UUID userId : uniqueIds) {
            NotificationRecipient r = new NotificationRecipient();
            r.setNotificationId(saved.getId());
            r.setUserId(userId);
            r.setRead(false);
            r.setDeliveredAt(LocalDateTime.now());
            r.setCreatedAt(LocalDateTime.now());
            recipients.add(r);
        }
        recipientRepository.saveAll(recipients);

        // 4. Push realtime notification to every recipient instantly
        NotificationResponse rtPayload = toResponseNoRecipient(saved);
        for (UUID userId : uniqueIds) {
            realtimePublisher.pushNotification(userId, rtPayload);
        }

        // 5. Return NotificationResponse (no specific recipient context for the creator)
        return toResponseNoRecipient(saved);
    }

    /**
     * Get paginated notifications for a specific user (sorted newest first).
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificationRecipient> recipientPage =
                recipientRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        // Batch-fetch Notification entities
        List<UUID> notifIds = recipientPage.getContent().stream()
                .map(NotificationRecipient::getNotificationId)
                .collect(Collectors.toList());

        Map<UUID, Notification> notifMap = notificationRepository.findAllById(notifIds)
                .stream()
                .collect(Collectors.toMap(Notification::getId, n -> n));

        // Merge into NotificationResponse list
        List<NotificationResponse> responses = recipientPage.getContent().stream()
                .filter(r -> notifMap.containsKey(r.getNotificationId()))
                .map(r -> toResponse(notifMap.get(r.getNotificationId()), r))
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, recipientPage.getTotalElements());
    }

    /**
     * Count unread notifications for a user.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return recipientRepository.countByUserIdAndReadFalse(userId);
    }

    /**
     * Mark a single notification as read for a user.
     */
    public void markAsRead(UUID notificationId, UUID userId) {
        recipientRepository.findByNotificationIdAndUserId(notificationId, userId)
                .ifPresent(r -> {
                    r.setRead(true);
                    r.setReadAt(LocalDateTime.now());
                    recipientRepository.save(r);
                });
    }

    /**
     * Mark ALL notifications as read for a user.
     */
    public void markAllAsRead(UUID userId) {
        List<NotificationRecipient> unread = recipientRepository.findByUserIdAndReadFalse(userId);
        LocalDateTime now = LocalDateTime.now();
        for (NotificationRecipient r : unread) {
            r.setRead(true);
            r.setReadAt(now);
        }
        recipientRepository.saveAll(unread);
    }

    /**
     * Admin: list all notifications (paginated, newest first).
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> listAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifPage = notificationRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<NotificationResponse> responses = notifPage.getContent().stream()
                .map(this::toResponseNoRecipient)
                .collect(Collectors.toList());
        return new PageImpl<>(responses, pageable, notifPage.getTotalElements());
    }

    /**
     * Admin: delete notification and all its recipient rows.
     */
    public void delete(UUID notificationId) {
        recipientRepository.deleteByNotificationId(notificationId);
        notificationRepository.deleteById(notificationId);
    }

    // ── Recipient resolver ────────────────────────────────────────────────────

    private List<UUID> resolveRecipients(NotificationTargetType targetType, UUID targetId) {
        return switch (targetType) {
            case ALL_USERS -> userRepository.findAll()
                    .stream()
                    .map(User::getId)
                    .distinct()
                    .collect(Collectors.toList());

            case ALL_TEAMS -> teamMembershipRepository.findByStatus(TeamMembershipStatus.ACTIVE)
                    .stream()
                    .map(TeamMembership::getUserId)
                    .distinct()
                    .collect(Collectors.toList());

            case TEAM -> teamMembershipRepository.findByTeamIdAndStatus(targetId, TeamMembershipStatus.ACTIVE)
                    .stream()
                    .map(TeamMembership::getUserId)
                    .collect(Collectors.toList());

            case USER -> targetId != null ? List.of(targetId) : List.of();

            case EVENT -> resolveEventRecipients(targetId);

            case SPORT -> resolveSportRecipients(targetId);
        };
    }

    private List<UUID> resolveEventRecipients(UUID eventId) {
        List<EventSports> sports = eventSportsRepository.findByEventId(eventId);
        Set<UUID> userIds = new LinkedHashSet<>();
        for (EventSports sport : sports) {
            List<SportRegistration> registrations = sportRegistrationRepository
                    .findByEventSportIdAndStatus(sport.getId(), RegistrationStatus.REGISTERED);
            for (SportRegistration reg : registrations) {
                if (reg.getTeamId() != null) {
                    teamMembershipRepository
                            .findByTeamIdAndStatus(reg.getTeamId(), TeamMembershipStatus.ACTIVE)
                            .stream()
                            .map(TeamMembership::getUserId)
                            .forEach(userIds::add);
                }
            }
        }
        return new ArrayList<>(userIds);
    }

    private List<UUID> resolveSportRecipients(UUID sportId) {
        List<SportRegistration> registrations = sportRegistrationRepository
                .findByEventSportIdAndStatus(sportId, RegistrationStatus.REGISTERED);
        Set<UUID> userIds = new LinkedHashSet<>();
        for (SportRegistration reg : registrations) {
            if (reg.getTeamId() != null) {
                teamMembershipRepository
                        .findByTeamIdAndStatus(reg.getTeamId(), TeamMembershipStatus.ACTIVE)
                        .stream()
                        .map(TeamMembership::getUserId)
                        .forEach(userIds::add);
            }
        }
        return new ArrayList<>(userIds);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private NotificationResponse toResponse(Notification n, NotificationRecipient r) {
        NotificationResponse resp = toResponseNoRecipient(n);
        if (r != null) {
            resp.setRecipientId(r.getId());
            resp.setRead(r.isRead());
            resp.setReadAt(r.getReadAt());
        }
        return resp;
    }

    private NotificationResponse toResponseNoRecipient(Notification n) {
        NotificationResponse resp = new NotificationResponse();
        resp.setId(n.getId());
        resp.setTitle(n.getTitle());
        resp.setMessage(n.getMessage());
        resp.setType(n.getType() != null ? n.getType().name() : null);
        resp.setPriority(n.getPriority() != null ? n.getPriority().name() : null);
        resp.setTargetType(n.getTargetType() != null ? n.getTargetType().name() : null);
        resp.setTargetId(n.getTargetId());
        resp.setActionUrl(n.getActionUrl());
        resp.setCustom(n.isCustom());
        resp.setCreatedBy(n.getCreatedBy());
        resp.setCreatedAt(n.getCreatedAt());
        resp.setRead(false);
        return resp;
    }
}
