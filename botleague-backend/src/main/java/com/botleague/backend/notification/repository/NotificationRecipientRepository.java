package com.botleague.backend.notification.repository;

import com.botleague.backend.notification.entity.NotificationRecipient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, UUID> {

    Page<NotificationRecipient> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<NotificationRecipient> findByNotificationIdAndUserId(UUID notificationId, UUID userId);

    long countByUserIdAndReadFalse(UUID userId);

    List<NotificationRecipient> findByUserIdAndReadFalse(UUID userId);

    @Transactional
    void deleteByNotificationId(UUID notificationId);

    @Transactional
    void deleteByUserId(UUID userId);
}
