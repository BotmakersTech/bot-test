package com.botleague.backend.notification.controller;

import com.botleague.backend.notification.dto.NotificationResponse;
import com.botleague.backend.notification.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * GET /api/notifications?page=0&size=20
     * Returns paginated notifications for the authenticated user.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        UUID userId = UUID.fromString((String) auth.getPrincipal());
        Page<NotificationResponse> result = notificationService.getMyNotifications(userId, page, size);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", result.getContent());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/notifications/unread-count
     * Returns the unread notification count for the authenticated user.
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Long> getUnreadCount(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(count);
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Marks a specific notification as read for the authenticated user.
     */
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID id,
            Authentication auth) {

        UUID userId = UUID.fromString((String) auth.getPrincipal());
        notificationService.markAsRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PATCH /api/notifications/read-all
     * Marks all notifications as read for the authenticated user.
     */
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllAsRead(Authentication auth) {
        UUID userId = UUID.fromString((String) auth.getPrincipal());
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}
