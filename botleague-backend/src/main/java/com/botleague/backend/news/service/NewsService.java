package com.botleague.backend.news.service;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.enums.AccountStatus;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.utils.EligibilityUtils;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.news.dto.NewsRequest;
import com.botleague.backend.news.dto.NewsResponse;
import com.botleague.backend.news.dto.NewsUpdateRequest;
import com.botleague.backend.news.entity.News;
import com.botleague.backend.news.repository.NewsRepository;
import com.botleague.backend.notification.dto.NotificationResponse;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Platform-wide News: Admin-authored content targeted by age category and/or
 * sport interest (or everyone, when both are empty), delivered through the
 * existing generic Notification system rather than a parallel one.
 *
 * See NotificationService.notifyUsers() for the delivery bridge and
 * OrganizerCommunicationService.getSportAnnouncementsForParticipant() for the
 * precedent this feed's fetch-then-filter-in-memory approach follows.
 */
@Service
@Transactional
public class NewsService {

    private static final int MAX_BODY_PREVIEW = 300;
    private static final int MAX_FEED_SCAN = 500;

    private final NewsRepository newsRepository;
    private final UserRepository userRepository;
    private final EventSportsRepository eventSportsRepository;
    private final SportRegistrationRepository sportRegistrationRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public NewsService(
            NewsRepository newsRepository,
            UserRepository userRepository,
            EventSportsRepository eventSportsRepository,
            SportRegistrationRepository sportRegistrationRepository,
            TeamMembershipRepository teamMembershipRepository,
            NotificationService notificationService,
            AuditLogService auditLogService,
            ObjectMapper objectMapper) {
        this.newsRepository = newsRepository;
        this.userRepository = userRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    // =====================================================
    // CREATE (= publish immediately, no draft workflow)
    // =====================================================

    public NewsResponse create(NewsRequest req, UUID createdBy) {
        List<AgeCategory> ages = parseAgeCategories(req.getTargetAgeCategories());
        List<String> sports = req.getTargetSports() == null ? List.of() : req.getTargetSports();

        Set<UUID> recipientIds = resolveRecipients(ages, sports);

        News news = new News();
        news.setTitle(req.getTitle());
        news.setBody(req.getBody());
        news.setCreatedBy(createdBy);
        news.setTargetAgeCategories(serialize(ages.stream().map(Enum::name).collect(Collectors.toList())));
        news.setTargetSports(serialize(sports));
        news.setAttachmentUrl(req.getAttachmentUrl());
        news.setAttachmentKey(req.getAttachmentKey());
        news.setAttachmentFileType(req.getAttachmentFileType());
        news.setIsPinned(Boolean.TRUE.equals(req.getIsPinned()));
        news.setIsArchived(false);
        news.setRecipientCount(recipientIds.size());
        news.setPublishedAt(LocalDateTime.now());
        News saved = newsRepository.save(news);

        NotificationResponse notification = notificationService.notifyUsers(
                new ArrayList<>(recipientIds),
                saved.getTitle(),
                truncate(saved.getBody(), MAX_BODY_PREVIEW),
                NotificationType.NEWS_PUBLISHED,
                NotificationPriority.MEDIUM,
                NotificationTargetType.NEWS,
                saved.getId(),
                "/news/" + saved.getId(),
                createdBy);

        saved.setNotificationId(notification.getId());
        saved = newsRepository.save(saved);

        try {
            auditLogService.log("NEWS_PUBLISHED", "NEWS", saved.getId(), saved.getTitle(),
                    null, "recipients=" + recipientIds.size());
        } catch (Exception ignored) {
            // Audit failure must never block a successful publish.
        }

        return toResponse(saved);
    }

    // =====================================================
    // ADMIN QUERIES / MANAGEMENT
    // =====================================================

    @Transactional(readOnly = true)
    public Page<NewsResponse> listAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<News> newsPage = newsRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<NewsResponse> content = newsPage.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, newsPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public NewsResponse getByIdForAdmin(UUID id) {
        News news = findOrThrow(id);
        return toResponse(news);
    }

    public NewsResponse update(UUID id, NewsUpdateRequest req) {
        News news = findOrThrow(id);
        if (req.getIsPinned() != null) news.setIsPinned(req.getIsPinned());
        if (req.getIsArchived() != null) news.setIsArchived(req.getIsArchived());
        News saved = newsRepository.save(news);
        return toResponse(saved);
    }

    public void delete(UUID id) {
        News news = findOrThrow(id);
        if (news.getNotificationId() != null) {
            try {
                notificationService.delete(news.getNotificationId());
            } catch (Exception ignored) {
                // Orphaning the notification is a non-fatal cleanup miss, not a reason to block deletion.
            }
        }
        newsRepository.deleteById(id);
        try {
            auditLogService.log("NEWS_DELETED", "NEWS", id, news.getTitle(),
                    "isPinned=" + news.getIsPinned() + ", isArchived=" + news.getIsArchived(), "DELETED");
        } catch (Exception ignored) {
        }
    }

    // =====================================================
    // COMPETITOR-FACING READ (eligibility-scoped)
    // =====================================================

    @Transactional(readOnly = true)
    public NewsResponse getForCaller(UUID id, UUID callerId, boolean callerIsAdmin) {
        News news = findOrThrow(id);
        if (callerIsAdmin) return toResponse(news);
        if (Boolean.TRUE.equals(news.getIsArchived()) || !isVisibleTo(news, callerId)) {
            // Never 403 here — a targeted-but-ineligible caller shouldn't learn the ID exists.
            throw ApiException.notFound("News item not found: " + id);
        }
        return toResponse(news);
    }

    @Transactional(readOnly = true)
    public Page<NewsResponse> getPublicFeed(UUID callerId, int page, int size) {
        List<News> candidates = newsRepository.findByIsArchivedFalseOrderByIsPinnedDescPublishedAtDesc();
        if (candidates.size() > MAX_FEED_SCAN) candidates = candidates.subList(0, MAX_FEED_SCAN);

        List<NewsResponse> visible = candidates.stream()
                .filter(n -> isVisibleTo(n, callerId))
                .map(this::toResponse)
                .collect(Collectors.toList());

        int from = Math.min(page * size, visible.size());
        int to = Math.min(from + size, visible.size());
        Pageable pageable = PageRequest.of(page, size);
        return new PageImpl<>(visible.subList(from, to), pageable, visible.size());
    }

    /** Visible if the caller's own age category and/or sport interests satisfy every set filter. */
    private boolean isVisibleTo(News news, UUID callerId) {
        List<AgeCategory> ages = deserializeAgeCategories(news.getTargetAgeCategories());
        List<String> sports = deserializeStrings(news.getTargetSports());

        if (ages.isEmpty() && sports.isEmpty()) return true;

        User caller = userRepository.findById(callerId).orElse(null);
        if (caller == null) return false;

        boolean ageOk = ages.isEmpty()
                || (caller.getDateOfBirth() != null
                    && ages.contains(EligibilityUtils.getCategoryFromDob(caller.getDateOfBirth())));

        boolean sportOk = sports.isEmpty() || callerSportInterests(callerId).stream().anyMatch(sports::contains);

        return ageOk && sportOk;
    }

    private Set<String> callerSportInterests(UUID callerId) {
        List<UUID> teamIds = teamMembershipRepository.findByUserId(callerId).stream()
                .map(TeamMembership::getTeamId)
                .distinct()
                .collect(Collectors.toList());
        if (teamIds.isEmpty()) return Set.of();

        List<UUID> eventSportIds = sportRegistrationRepository.findByTeamIdIn(teamIds).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.REGISTERED)
                .map(SportRegistration::getEventSportId)
                .distinct()
                .collect(Collectors.toList());
        if (eventSportIds.isEmpty()) return Set.of();

        return eventSportsRepository.findAllById(eventSportIds).stream()
                .map(EventSports::getSport)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toSet());
    }

    // =====================================================
    // RECIPIENT RESOLUTION (create-time, platform-wide)
    // =====================================================

    private Set<UUID> resolveRecipients(List<AgeCategory> ages, List<String> sports) {
        boolean hasAge = !ages.isEmpty();
        boolean hasSport = !sports.isEmpty();

        if (!hasAge && !hasSport) return activeUserIds();
        if (hasAge && !hasSport) return resolveByAge(ages);
        if (!hasAge && hasSport) return resolveBySport(sports);

        // Both facets set — intersect (AND).
        Set<UUID> intersection = resolveByAge(ages);
        intersection.retainAll(resolveBySport(sports));
        return intersection;
    }

    private Set<UUID> activeUserIds() {
        return userRepository.findByAccountStatusAndDeletedAtIsNull(AccountStatus.ACTIVE).stream()
                .map(User::getId)
                .collect(Collectors.toSet());
    }

    /** Current age (via EligibilityUtils, the one canonical implementation) — not the age they were at registration time. */
    private Set<UUID> resolveByAge(List<AgeCategory> ages) {
        return userRepository.findByAccountStatusAndDeletedAtIsNull(AccountStatus.ACTIVE).stream()
                .filter(u -> u.getDateOfBirth() != null
                        && ages.contains(EligibilityUtils.getCategoryFromDob(u.getDateOfBirth())))
                .map(User::getId)
                .collect(Collectors.toSet());
    }

    private Set<UUID> resolveBySport(List<String> sports) {
        List<UUID> eventSportIds = eventSportsRepository.findBySportIn(sports).stream()
                .map(EventSports::getId)
                .collect(Collectors.toList());
        if (eventSportIds.isEmpty()) return new LinkedHashSet<>();

        List<SportRegistration> regs = sportRegistrationRepository
                .findByEventSportIdInAndStatus(eventSportIds, RegistrationStatus.REGISTERED);

        Set<UUID> userIds = new LinkedHashSet<>();
        for (SportRegistration reg : regs) {
            if (reg.getTeamId() == null) continue;
            teamMembershipRepository.findByTeamIdAndStatus(reg.getTeamId(), TeamMembershipStatus.ACTIVE)
                    .stream().map(TeamMembership::getUserId).forEach(userIds::add);
        }
        userIds.retainAll(activeUserIds());
        return userIds;
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private News findOrThrow(UUID id) {
        return newsRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("News item not found: " + id));
    }

    private List<AgeCategory> parseAgeCategories(List<String> raw) {
        if (raw == null || raw.isEmpty()) return List.of();
        try {
            return raw.stream().map(AgeCategory::valueOf).collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid age category in targetAgeCategories: " + e.getMessage());
        }
    }

    private List<AgeCategory> deserializeAgeCategories(String json) {
        return deserializeStrings(json).stream()
                .map(s -> {
                    try {
                        return AgeCategory.valueOf(s);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    private List<String> deserializeStrings(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String serialize(List<String> values) {
        if (values == null || values.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            return null;
        }
    }

    private String truncate(String text, int max) {
        if (text == null || text.length() <= max) return text;
        return text.substring(0, max - 1) + "…";
    }

    private NewsResponse toResponse(News n) {
        NewsResponse r = new NewsResponse();
        r.id = n.getId();
        r.title = n.getTitle();
        r.body = n.getBody();
        r.createdBy = n.getCreatedBy();
        r.targetAgeCategories = deserializeStrings(n.getTargetAgeCategories());
        r.targetSports = deserializeStrings(n.getTargetSports());
        r.attachmentUrl = n.getAttachmentUrl();
        r.attachmentKey = n.getAttachmentKey();
        r.attachmentFileType = n.getAttachmentFileType();
        r.isPinned = n.getIsPinned();
        r.isArchived = n.getIsArchived();
        r.recipientCount = n.getRecipientCount();
        r.publishedAt = n.getPublishedAt();
        r.createdAt = n.getCreatedAt();
        r.updatedAt = n.getUpdatedAt();
        return r;
    }
}
