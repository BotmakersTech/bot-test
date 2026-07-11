package com.botleague.backend.chat.repository;

import com.botleague.backend.chat.entity.ChatRoom;
import com.botleague.backend.chat.enums.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    List<ChatRoom> findByReferenceId(UUID referenceId);

    Optional<ChatRoom> findByTypeAndReferenceId(ChatRoomType type, UUID referenceId);

    Optional<ChatRoom> findByTypeAndReferenceIdAndSecondaryReferenceId(
            ChatRoomType type, UUID referenceId, UUID secondaryReferenceId);

    /**
     * For DIRECT chats — stored with min(userId1, userId2) as referenceId and
     * max(...) as secondaryReferenceId. This query finds the normalised row.
     */
    @Query("SELECT r FROM ChatRoom r WHERE r.type = 'DIRECT' " +
           "AND r.referenceId = :userId1 AND r.secondaryReferenceId = :userId2")
    Optional<ChatRoom> findDirectRoom(
            @Param("userId1") UUID userId1,
            @Param("userId2") UUID userId2);
}
