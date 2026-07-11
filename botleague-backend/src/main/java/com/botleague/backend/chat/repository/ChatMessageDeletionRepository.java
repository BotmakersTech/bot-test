package com.botleague.backend.chat.repository;

import com.botleague.backend.chat.entity.ChatMessageDeletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ChatMessageDeletionRepository extends JpaRepository<ChatMessageDeletion, UUID> {

    boolean existsByMessageIdAndUserId(UUID messageId, UUID userId);

    List<ChatMessageDeletion> findByUserIdAndMessageIdIn(UUID userId, List<UUID> messageIds);

    default Set<UUID> findDeletedMessageIds(UUID userId, List<UUID> messageIds) {
        return findByUserIdAndMessageIdIn(userId, messageIds)
                .stream()
                .map(ChatMessageDeletion::getMessageId)
                .collect(java.util.stream.Collectors.toSet());
    }
}
