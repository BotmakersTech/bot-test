package com.botleague.backend.notification.controller;

import com.botleague.backend.notification.dto.CreateNotificationRequest;
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
@RequestMapping("/api/admin/notifications")
public class AdminNotificationController {

    private final NotificationService notificationService;

    public AdminNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * POST /api/admin/notifications
     * Create and dispatch a new notification.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<NotificationResponse> dispatch(
            @RequestBody CreateNotificationRequest req,
            Authentication auth) {

        UUID createdBy = UUID.fromString((String) auth.getPrincipal());
        NotificationResponse response = notificationService.dispatch(req, createdBy);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/notifications?page=0&size=20
     * List all notifications (paginated, newest first).
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<Map<String, Object>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        Page<NotificationResponse> result = notificationService.listAll(page, size);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", result.getContent());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/admin/notifications/{id}
     * Delete a notification and all its recipient rows.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            Authentication auth) {

        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
