package com.botleague.backend.achievement.service;

import com.botleague.backend.achievement.dto.AchievementResponseDTO;
import com.botleague.backend.achievement.entity.Achievement;
import com.botleague.backend.achievement.enums.AchievementType;
import com.botleague.backend.achievement.repository.AchievementRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.realtime.enums.RealtimeEventType;
import com.botleague.backend.realtime.service.RealtimePublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final NotificationService notificationService;
    private final RealtimePublisher realtimePublisher;

    public AchievementService(
            AchievementRepository achievementRepository,
            NotificationService notificationService,
            RealtimePublisher realtimePublisher) {
        this.achievementRepository = achievementRepository;
        this.notificationService = notificationService;
        this.realtimePublisher = realtimePublisher;
    }

    public void unlock(UUID userId, UUID eventId, AchievementType type) {
        if (achievementRepository.existsByUserIdAndEventIdAndType(userId, eventId, type)) {
            return;
        }

        Achievement achievement = new Achievement();
        achievement.setUserId(userId);
        achievement.setEventId(eventId);
        achievement.setType(type);
        achievement.setUnlockedAt(LocalDateTime.now());

        Achievement saved;
        try {
            saved = achievementRepository.save(achievement);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // Concurrent unlock: another thread inserted first — not an error.
            return;
        }
        AchievementResponseDTO response = mapToDTO(saved);

        notificationService.systemNotify(
            "Achievement Unlocked: " + type.name(),
            "You have unlocked the " + type.name().replace("_", " ") + " achievement!",
            NotificationType.ACHIEVEMENT_UNLOCKED,
            NotificationPriority.HIGH,
            NotificationTargetType.USER,
            userId,
            null
        );

        realtimePublisher.toUser(userId.toString(), RealtimeEventType.ACHIEVEMENT_UNLOCKED, response);
    }

    @Transactional(readOnly = true)
    public List<AchievementResponseDTO> getMyAchievements(UUID userId) {
        return achievementRepository.findByUserIdOrderByUnlockedAtDesc(userId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private AchievementResponseDTO mapToDTO(Achievement achievement) {
        AchievementResponseDTO dto = new AchievementResponseDTO();
        dto.setId(achievement.getId());
        dto.setUserId(achievement.getUserId());
        dto.setEventId(achievement.getEventId());
        dto.setType(achievement.getType().name());
        dto.setUnlockedAt(achievement.getUnlockedAt());
        return dto;
    }
}
