package com.botleague.backend.chat.service;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.chat.dto.ChatMessageResponse;
import com.botleague.backend.chat.dto.ChatRoomListResponse;
import com.botleague.backend.chat.dto.ChatRoomResponse;
import com.botleague.backend.chat.entity.ChatMessage;
import com.botleague.backend.chat.entity.ChatParticipant;
import com.botleague.backend.chat.entity.ChatRoom;
import com.botleague.backend.chat.enums.ChatRoomType;
import com.botleague.backend.chat.repository.ChatMessageRepository;
import com.botleague.backend.chat.repository.ChatParticipantRepository;
import com.botleague.backend.chat.repository.ChatRoomRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatService {

    // Sentinel UUID used as senderId for system-generated messages
    private static final UUID SYSTEM_SENDER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final ChatRoomRepository chatRoomRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.botleague.backend.common.service.GetFileService getFileService;

    public ChatService(
            ChatRoomRepository chatRoomRepository,
            ChatParticipantRepository chatParticipantRepository,
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            TeamMembershipRepository teamMembershipRepository,
            SimpMessagingTemplate messagingTemplate,
            com.botleague.backend.common.service.GetFileService getFileService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatParticipantRepository = chatParticipantRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.messagingTemplate = messagingTemplate;
        this.getFileService = getFileService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ROOM CREATION
    // ─────────────────────────────────────────────────────────────────────────

    public ChatRoom createTeamChat(UUID teamId, String teamName, List<UUID> memberIds) {
        return chatRoomRepository.findByTypeAndReferenceId(ChatRoomType.TEAM, teamId)
                .orElseGet(() -> {
                    ChatRoom room = new ChatRoom();
                    room.setType(ChatRoomType.TEAM);
                    room.setName(teamName + " Team Chat");
                    room.setReferenceId(teamId);
                    ChatRoom saved = chatRoomRepository.save(room);
                    for (UUID memberId : memberIds) {
                        addParticipant(saved.getId(), memberId, true);
                    }
                    return saved;
                });
    }

    /**
     * Called when a user accepts a team invitation.
     * Adds (or reactivates) them in the team chat and broadcasts an appropriate system message.
     * Returns true if this was a rejoin (participant record previously existed but was inactive).
     */
    public boolean addMemberToTeamChat(UUID teamId, UUID userId) {
        var roomOpt = chatRoomRepository.findByTypeAndReferenceId(ChatRoomType.TEAM, teamId);
        if (roomOpt.isEmpty()) return false;

        ChatRoom room = roomOpt.get();
        boolean alreadyActive = chatParticipantRepository
                .existsByChatRoomIdAndUserIdAndIsActiveTrue(room.getId(), userId);
        if (alreadyActive) return false;

        // Detect rejoin: participant record exists but is currently inactive
        boolean isRejoin = chatParticipantRepository
                .findByChatRoomIdAndUserId(room.getId(), userId)
                .isPresent();

        addParticipant(room.getId(), userId, true);
        String displayName = resolveDisplayName(userId);
        String eventText = isRejoin
                ? displayName + " rejoined the team chat."
                : displayName + " joined the team chat.";
        sendSystemMessage(room.getId(), eventText);
        return isRejoin;
    }

    /**
     * Called when a user leaves or is removed from a team.
     * Deactivates their participant record and broadcasts a system leave message.
     */
    public void removeMemberFromTeamChat(UUID teamId, UUID userId, String reason) {
        chatRoomRepository.findByTypeAndReferenceId(ChatRoomType.TEAM, teamId)
                .ifPresent(room -> {
                    chatParticipantRepository.findByChatRoomIdAndUserId(room.getId(), userId)
                            .ifPresent(p -> {
                                p.setActive(false);
                                chatParticipantRepository.save(p);
                            });
                    String displayName = resolveDisplayName(userId);
                    sendSystemMessage(room.getId(), displayName + " " + reason);
                });
    }

    /**
     * Find-or-create the one chat room shared by a team for a whole event —
     * covers every sport that team registers for within it. Called every time
     * a registration happens or a lineup member is assigned, so it's both
     * idempotent (safe to call repeatedly) and self-healing (re-adds anyone
     * who should be present but isn't yet, without duplicating or erroring).
     *
     * captainId is always (re-)added if present; lineupUserIds are the current
     * lineup-assigned team members for this event; organizerUserId is the
     * event creator. Any of these may be null/empty on a given call.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ChatRoom getOrCreateEventTeamChat(
            UUID teamId,
            UUID eventId,
            String eventName,
            UUID captainId,
            List<UUID> lineupUserIds,
            UUID organizerUserId) {

        ChatRoom room = chatRoomRepository
                .findByTypeAndReferenceIdAndSecondaryReferenceId(ChatRoomType.EVENT_TEAM, teamId, eventId)
                .orElseGet(() -> {
                    ChatRoom r = new ChatRoom();
                    r.setType(ChatRoomType.EVENT_TEAM);
                    r.setName(eventName != null ? eventName : "Event");
                    r.setReferenceId(teamId);
                    r.setSecondaryReferenceId(eventId);
                    return chatRoomRepository.save(r);
                });

        if (captainId != null) {
            addParticipant(room.getId(), captainId, true);
        }
        if (lineupUserIds != null) {
            for (UUID userId : lineupUserIds) {
                addParticipant(room.getId(), userId, true);
            }
        }
        if (organizerUserId != null) {
            addParticipant(room.getId(), organizerUserId, true);
        }

        return room;
    }

    /**
     * Captain-only: adds a team member who isn't in this event's lineup to the
     * team's event chat room. Target must be an ACTIVE roster member of the
     * same team the room belongs to — you cannot add outsiders.
     */
    public void addTeamMemberToEventTeamChat(UUID chatRoomId, UUID requesterId, UUID targetUserId) {
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> ApiException.notFound("Chat room not found"));

        if (room.getType() != ChatRoomType.EVENT_TEAM) {
            throw ApiException.badRequest("Members can only be added to an event team chat.");
        }

        UUID teamId = room.getReferenceId();
        assertIsCaptain(teamId, requesterId);

        boolean targetOnTeam = teamMembershipRepository
                .findByTeamIdAndUserIdAndStatus(teamId, targetUserId, TeamMembershipStatus.ACTIVE)
                .isPresent();
        if (!targetOnTeam) {
            throw ApiException.badRequest("Only active members of your team can be added to this chat.");
        }

        addParticipant(chatRoomId, targetUserId, true);
        String displayName = resolveDisplayName(targetUserId);
        sendSystemMessage(chatRoomId, displayName + " was added to the chat.");
    }

    /**
     * Captain-only: team roster members who are NOT yet participants of this
     * event team chat room — the candidate list for addTeamMemberToEventTeamChat.
     */
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getAddableTeamMembers(UUID chatRoomId, UUID requesterId) {
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> ApiException.notFound("Chat room not found"));

        if (room.getType() != ChatRoomType.EVENT_TEAM) {
            return List.of();
        }

        UUID teamId = room.getReferenceId();
        assertIsCaptain(teamId, requesterId);

        java.util.Set<UUID> activeParticipantIds = chatParticipantRepository
                .findByChatRoomIdAndIsActiveTrue(chatRoomId)
                .stream()
                .map(ChatParticipant::getUserId)
                .collect(Collectors.toSet());

        return teamMembershipRepository.findByTeamIdAndStatus(teamId, TeamMembershipStatus.ACTIVE)
                .stream()
                .map(TeamMembership::getUserId)
                .filter(uid -> !activeParticipantIds.contains(uid))
                .distinct()
                .map(uid -> {
                    java.util.Map<String, Object> entry = new java.util.HashMap<>();
                    entry.put("userId", uid);
                    userRepository.findById(uid).ifPresent(u -> {
                        entry.put("displayName", buildDisplayName(u));
                        entry.put("botleagueId", u.getBotleagueId());
                        entry.put("profilePhotoUrl", getFileService.resolveProfileImage(u.getProfilePhotoUrl()));
                    });
                    return entry;
                })
                .collect(Collectors.toList());
    }

    private void assertIsCaptain(UUID teamId, UUID userId) {
        boolean isCaptain = teamMembershipRepository
                .existsByTeamIdAndUserIdAndRoleInTeamAndStatus(
                        teamId, userId, com.botleague.backend.team.enums.TeamRole.CAPTAIN, TeamMembershipStatus.ACTIVE);
        if (!isCaptain) {
            throw ApiException.forbidden("Only the team captain can manage this chat's members.");
        }
    }

    /**
     * Returns or creates an EVENT_ANNOUNCEMENT room for the given event.
     * Adds the organizer as a participant if provided.
     * All registered team members for this event should be added separately
     * when they register (see SportRegistrationService).
     */
    public ChatRoom getOrCreateEventAnnouncementRoom(UUID eventId, String eventName, UUID organizerUserId) {
        return chatRoomRepository.findByTypeAndReferenceId(ChatRoomType.EVENT_ANNOUNCEMENT, eventId)
                .orElseGet(() -> {
                    ChatRoom room = new ChatRoom();
                    room.setType(ChatRoomType.EVENT_ANNOUNCEMENT);
                    room.setName(eventName + " — Announcements");
                    room.setReferenceId(eventId);
                    ChatRoom saved = chatRoomRepository.save(room);
                    if (organizerUserId != null) {
                        addParticipant(saved.getId(), organizerUserId, true);
                    }
                    return saved;
                });
    }

    /**
     * Returns or creates a SPORT_ANNOUNCEMENT room for the given event sport.
     */
    public ChatRoom getOrCreateSportAnnouncementRoom(UUID eventSportId, String sportLabel, UUID organizerUserId) {
        return chatRoomRepository.findByTypeAndReferenceId(ChatRoomType.SPORT_ANNOUNCEMENT, eventSportId)
                .orElseGet(() -> {
                    ChatRoom room = new ChatRoom();
                    room.setType(ChatRoomType.SPORT_ANNOUNCEMENT);
                    room.setName(sportLabel + " — Announcements");
                    room.setReferenceId(eventSportId);
                    ChatRoom saved = chatRoomRepository.save(room);
                    if (organizerUserId != null) {
                        addParticipant(saved.getId(), organizerUserId, true);
                    }
                    return saved;
                });
    }

    /**
     * Creates or retrieves a direct chat between two users.
     * Normalizes by always storing min(uuid) as referenceId.
     */
    public ChatRoom getOrCreateDirectChat(UUID userId1, UUID userId2) {
        List<TeamMembership> memberships1 = teamMembershipRepository.findByUserId(userId1);
        List<TeamMembership> memberships2 = teamMembershipRepository.findByUserId(userId2);

        java.util.Set<UUID> teamIds1 = memberships1.stream()
                .filter(m -> m.getStatus() == TeamMembershipStatus.ACTIVE)
                .map(TeamMembership::getTeamId)
                .collect(java.util.stream.Collectors.toSet());

        boolean sharedTeam = memberships2.stream()
                .filter(m -> m.getStatus() == TeamMembershipStatus.ACTIVE)
                .anyMatch(m -> teamIds1.contains(m.getTeamId()));

        if (!sharedTeam) {
            throw ApiException.forbidden("You can only message teammates");
        }

        UUID minId = userId1.compareTo(userId2) <= 0 ? userId1 : userId2;
        UUID maxId = userId1.compareTo(userId2) <= 0 ? userId2 : userId1;

        return chatRoomRepository.findDirectRoom(minId, maxId)
                .orElseGet(() -> {
                    User user1 = userRepository.findById(userId1).orElse(null);
                    User user2 = userRepository.findById(userId2).orElse(null);
                    String name1 = user1 != null && user1.getFirstName() != null ? user1.getFirstName() : "User";
                    String name2 = user2 != null && user2.getFirstName() != null ? user2.getFirstName() : "User";

                    ChatRoom room = new ChatRoom();
                    room.setType(ChatRoomType.DIRECT);
                    room.setName(name1 + " & " + name2);
                    room.setReferenceId(minId);
                    room.setSecondaryReferenceId(maxId);
                    ChatRoom saved = chatRoomRepository.save(room);

                    addParticipant(saved.getId(), userId1, true);
                    addParticipant(saved.getId(), userId2, true);
                    return saved;
                });
    }

    public ChatRoom createEventAnnouncementChannel(UUID eventId, String eventName) {
        return chatRoomRepository.findByTypeAndReferenceId(ChatRoomType.EVENT_ANNOUNCEMENT, eventId)
                .orElseGet(() -> {
                    ChatRoom room = new ChatRoom();
                    room.setType(ChatRoomType.EVENT_ANNOUNCEMENT);
                    room.setName(eventName + " Announcements");
                    room.setReferenceId(eventId);
                    return chatRoomRepository.save(room);
                });
    }

    public ChatRoom createSportAnnouncementChannel(UUID eventSportId, String sportName, UUID eventId) {
        return chatRoomRepository.findByTypeAndReferenceId(ChatRoomType.SPORT_ANNOUNCEMENT, eventSportId)
                .orElseGet(() -> {
                    ChatRoom room = new ChatRoom();
                    room.setType(ChatRoomType.SPORT_ANNOUNCEMENT);
                    room.setName(sportName + " Announcements");
                    room.setReferenceId(eventSportId);
                    room.setSecondaryReferenceId(eventId);
                    return chatRoomRepository.save(room);
                });
    }

    public ChatRoom createMatchRoom(UUID matchId, Integer roundNumber, List<UUID> memberUserIds) {
        return chatRoomRepository.findByTypeAndReferenceId(ChatRoomType.MATCH, matchId)
                .orElseGet(() -> {
                    ChatRoom room = new ChatRoom();
                    room.setType(ChatRoomType.MATCH);
                    room.setName("Match Room - Round " + (roundNumber != null ? roundNumber : 1));
                    room.setReferenceId(matchId);
                    ChatRoom saved = chatRoomRepository.save(room);
                    if (memberUserIds != null) {
                        for (UUID userId : memberUserIds) {
                            addParticipant(saved.getId(), userId, true);
                        }
                    }
                    return saved;
                });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PARTICIPANT MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    public void addParticipant(UUID chatRoomId, UUID userId, boolean canSend) {
        chatParticipantRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .ifPresentOrElse(
                        existing -> {
                            if (!existing.isActive()) {
                                existing.setActive(true);
                                existing.setCanSend(canSend);
                                chatParticipantRepository.save(existing);
                            }
                        },
                        () -> {
                            ChatParticipant participant = new ChatParticipant();
                            participant.setChatRoomId(chatRoomId);
                            participant.setUserId(userId);
                            participant.setCanSend(canSend);
                            participant.setActive(true);
                            chatParticipantRepository.save(participant);
                        }
                );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MESSAGING
    // ─────────────────────────────────────────────────────────────────────────

    public ChatMessageResponse sendMessage(UUID chatRoomId, UUID senderId, String content) {
        ChatParticipant participant = chatParticipantRepository
                .findByChatRoomIdAndUserId(chatRoomId, senderId)
                .orElseThrow(() -> ApiException.forbidden("You are not a participant in this chat"));

        if (!participant.isActive()) {
            throw ApiException.forbidden("You are no longer a participant in this chat");
        }
        if (!participant.isCanSend()) {
            throw ApiException.forbidden("You do not have permission to send messages in this chat");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        ChatMessage message = new ChatMessage();
        message.setChatRoomId(chatRoomId);
        message.setSenderId(senderId);
        message.setSenderName(buildDisplayName(sender));
        message.setSenderPhotoUrl(getFileService.resolveProfileImage(sender.getProfilePhotoUrl()));
        message.setContent(content);

        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageResponse response = toMessageResponse(saved, senderId);
        messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId, response);
        return response;
    }

    /**
     * Posts a system-generated message (join, leave, etc.) that renders
     * differently in the UI. Uses a sentinel sender ID so no DB schema change
     * is required on the nullable senderId column.
     */
    public void sendSystemMessage(UUID chatRoomId, String content) {
        ChatMessage message = new ChatMessage();
        message.setChatRoomId(chatRoomId);
        message.setSenderId(SYSTEM_SENDER_ID);
        message.setSenderName("System");
        message.setContent(content);
        message.setSystem(true);

        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageResponse response = toMessageResponse(saved, null);
        messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId, response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ TRACKING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Marks all messages in a room as read for the given user by updating
     * their lastReadAt timestamp.
     */
    public void markRoomRead(UUID chatRoomId, UUID userId) {
        chatParticipantRepository.findByChatRoomIdAndUserId(chatRoomId, userId)
                .ifPresent(p -> {
                    if (p.isActive()) {
                        p.setLastReadAt(LocalDateTime.now());
                        chatParticipantRepository.save(p);
                    }
                });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ChatRoomListResponse getMyChatRooms(UUID userId) {
        List<ChatParticipant> participations = chatParticipantRepository.findByUserIdAndIsActiveTrue(userId);

        List<ChatRoomResponse> teamChats = new ArrayList<>();
        List<ChatRoomResponse> directChats = new ArrayList<>();
        List<ChatRoomResponse> registrationChats = new ArrayList<>();
        List<ChatRoomResponse> announcementChats = new ArrayList<>();

        for (ChatParticipant p : participations) {
            chatRoomRepository.findById(p.getChatRoomId()).ifPresent(room -> {
                if (!room.isActive()) return;
                ChatRoomResponse roomResponse = buildRoomResponse(room, p, userId);
                switch (room.getType()) {
                    case TEAM -> teamChats.add(roomResponse);
                    case DIRECT -> directChats.add(roomResponse);
                    case REGISTRATION, EVENT_TEAM -> registrationChats.add(roomResponse);
                    case EVENT_ANNOUNCEMENT, SPORT_ANNOUNCEMENT -> announcementChats.add(roomResponse);
                    case MATCH -> { /* match rooms not shown in main chat list */ }
                }
            });
        }

        return new ChatRoomListResponse(teamChats, directChats, registrationChats, announcementChats);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID chatRoomId, UUID userId) {
        boolean isParticipant = chatParticipantRepository
                .existsByChatRoomIdAndUserIdAndIsActiveTrue(chatRoomId, userId);
        if (!isParticipant) {
            throw ApiException.forbidden("You are not a participant in this chat");
        }
        return chatMessageRepository
                .findTop50ByChatRoomIdAndIsDeletedFalseOrderBySentAtAsc(chatRoomId)
                .stream()
                .map(m -> toMessageResponse(m, userId))
                .collect(Collectors.toList());
    }

    /**
     * Permanently deletes a message — only the original sender may do this,
     * and it disappears for every participant, not just the caller. Broadcasts
     * the removal so anyone with the room open live sees it vanish too.
     */
    public void deleteMessage(UUID messageId, UUID userId) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> ApiException.notFound("Message not found"));

        if (!userId.equals(message.getSenderId())) {
            throw ApiException.forbidden("Only the sender can delete this message.");
        }

        if (message.isDeleted()) {
            return;
        }

        message.setDeleted(true);
        message.setContent("");
        ChatMessage saved = chatMessageRepository.save(message);

        ChatMessageResponse response = toMessageResponse(saved, null);
        messagingTemplate.convertAndSend("/topic/chat/" + saved.getChatRoomId(), response);
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getParticipants(UUID chatRoomId, UUID requesterId) {
        boolean isParticipant = chatParticipantRepository
                .existsByChatRoomIdAndUserIdAndIsActiveTrue(chatRoomId, requesterId);
        if (!isParticipant) {
            throw ApiException.forbidden("You are not a participant in this chat");
        }
        return chatParticipantRepository.findByChatRoomIdAndIsActiveTrue(chatRoomId)
                .stream()
                .map(p -> {
                    java.util.Map<String, Object> entry = new java.util.HashMap<>();
                    entry.put("userId", p.getUserId());
                    entry.put("canSend", p.isCanSend());
                    entry.put("joinedAt", p.getJoinedAt());
                    userRepository.findById(p.getUserId()).ifPresent(u -> {
                        entry.put("displayName", buildDisplayName(u));
                        entry.put("botleagueId", u.getBotleagueId());
                        entry.put("profilePhotoUrl", getFileService.resolveProfileImage(u.getProfilePhotoUrl()));
                    });
                    return entry;
                })
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private ChatRoomResponse buildRoomResponse(ChatRoom room, ChatParticipant participant, UUID userId) {
        ChatRoomResponse response = new ChatRoomResponse();
        response.setId(room.getId());
        response.setType(room.getType().name());
        response.setName(room.getName());
        response.setReferenceId(room.getReferenceId());
        response.setCanSend(participant.isCanSend());

        // Real unread count based on lastReadAt
        LocalDateTime baseline = participant.getLastReadAt() != null
                ? participant.getLastReadAt()
                : participant.getJoinedAt();
        int unread = (int) chatMessageRepository.countByChatRoomIdAndSentAtAfterAndIsDeletedFalse(
                room.getId(), baseline);
        response.setUnreadCount(unread);

        // Efficient last-message lookup (single query, no full load)
        chatMessageRepository.findTopByChatRoomIdAndIsDeletedFalseOrderBySentAtDesc(room.getId())
                .ifPresent(last -> response.setLastMessage(toMessageResponse(last, userId)));

        return response;
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message, UUID currentUserId) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setChatRoomId(message.getChatRoomId());
        response.setSenderId(message.getSenderId());
        response.setSenderName(message.getSenderName());
        response.setSenderPhotoUrl(message.getSenderPhotoUrl());
        response.setContent(message.getContent());
        response.setSentAt(message.getSentAt());
        response.setDeleted(message.isDeleted());
        response.setSystem(message.isSystem());
        response.setMine(currentUserId != null && message.getSenderId().equals(currentUserId));
        return response;
    }

    private String buildDisplayName(User user) {
        if (user.getFirstName() != null && user.getLastName() != null) {
            return user.getFirstName() + " " + user.getLastName();
        } else if (user.getFirstName() != null) {
            return user.getFirstName();
        } else if (user.getUsername() != null) {
            return user.getUsername();
        }
        return "User";
    }

    private String resolveDisplayName(UUID userId) {
        return userRepository.findById(userId)
                .map(this::buildDisplayName)
                .orElse("A member");
    }
}
