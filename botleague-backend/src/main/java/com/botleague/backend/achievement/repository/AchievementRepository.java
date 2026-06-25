package com.botleague.backend.achievement.repository;

import com.botleague.backend.achievement.entity.Achievement;
import com.botleague.backend.achievement.enums.AchievementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, UUID> {

    List<Achievement> findByUserIdOrderByUnlockedAtDesc(UUID userId);

    boolean existsByUserIdAndEventIdAndType(UUID userId, UUID eventId, AchievementType type);
}
