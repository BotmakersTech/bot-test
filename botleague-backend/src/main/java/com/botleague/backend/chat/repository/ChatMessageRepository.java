package com.botleague.backend.chat.repository;

import com.botleague.backend.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Page<ChatMessage> findByChatRoomIdAndIsDeletedFalseOrderBySentAtAsc(UUID chatRoomId, Pageable pageable);

    List<ChatMessage> findTop50ByChatRoomIdAndIsDeletedFalseOrderBySentAtAsc(UUID chatRoomId);

    Optional<ChatMessage> findTopByChatRoomIdAndIsDeletedFalseOrderBySentAtDesc(UUID chatRoomId);

    long countByChatRoomIdAndSentAtAfterAndIsDeletedFalse(UUID chatRoomId, LocalDateTime after);
}
