package com.botleague.backend.audit.controller;

import com.botleague.backend.audit.dto.AuditLogResponse;
import com.botleague.backend.audit.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /** Last 30 entries — used by the admin dashboard activity feed. */
    @GetMapping("/recent")
    public ResponseEntity<List<AuditLogResponse>> getRecent() {
        return ResponseEntity.ok(auditLogService.getRecent());
    }

    /** Paginated full log, optionally filtered by entityType. */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String entityType
    ) {
        Page<AuditLogResponse> result = auditLogService.getAll(page, size, entityType);
        return ResponseEntity.ok(Map.of(
                "content",       result.getContent(),
                "page",          result.getNumber(),
                "size",          result.getSize(),
                "totalElements", result.getTotalElements(),
                "totalPages",    result.getTotalPages()
        ));
    }

    /** Audit history for a single entity (e.g. one event or registration). */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> getByEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AuditLogResponse> result = auditLogService.getByEntity(entityType, entityId, page, size);
        return ResponseEntity.ok(Map.of(
                "content",       result.getContent(),
                "page",          result.getNumber(),
                "size",          result.getSize(),
                "totalElements", result.getTotalElements(),
                "totalPages",    result.getTotalPages()
        ));
    }
}
