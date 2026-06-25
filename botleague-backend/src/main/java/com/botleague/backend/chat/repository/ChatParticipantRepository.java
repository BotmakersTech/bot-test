package com.botleague.backend.chat.repository;

import com.botleague.backend.chat.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {

    List<ChatParticipant> findByChatRoomIdAndIsActiveTrue(UUID chatRoomId);

    Optional<ChatParticipant> findByChatRoomIdAndUserId(UUID chatRoomId, UUID userId);

    List<ChatParticipant> findByUserId(UUID userId);

    List<ChatParticipant> findByUserIdAndIsActiveTrue(UUID userId);

    boolean existsByChatRoomIdAndUserIdAndIsActiveTrue(UUID chatRoomId, UUID userId);
}
