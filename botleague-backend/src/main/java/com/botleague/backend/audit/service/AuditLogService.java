package com.botleague.backend.audit.service;

import com.botleague.backend.audit.dto.AuditLogResponse;
import com.botleague.backend.audit.entity.AuditLog;
import com.botleague.backend.audit.repository.AuditLogRepository;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository,
                           UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * Log an audit event. Resolves the current actor from the Spring Security context —
     * no need to pass authentication through service method chains.
     */
    @Transactional
    public void log(String action,
                    String entityType,
                    UUID entityId,
                    String entityName,
                    String oldValue,
                    String newValue) {
        log(action, entityType, entityId, entityName, oldValue, newValue, null);
    }

    @Transactional
    public void log(String action,
                    String entityType,
                    UUID entityId,
                    String entityName,
                    String oldValue,
                    String newValue,
                    String reason) {
        AuditLog entry = new AuditLog();
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setEntityName(entityName);
        entry.setOldValue(oldValue);
        entry.setNewValue(newValue);
        entry.setReason(reason);
        entry.setCreatedAt(LocalDateTime.now());

        // Resolve actor from security context
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof String principalStr) {
                UUID actorId = UUID.fromString(principalStr);
                entry.setActorId(actorId);
                userRepository.findById(actorId).ifPresent(u -> entry.setActorEmail(u.getEmail()));
            }
        } catch (Exception ignored) {
            // System-generated action — no actor
        }

        auditLogRepository.save(entry);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getRecent() {
        return auditLogRepository.findTop30ByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAll(int page, int size, String entityType) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> raw = entityType != null && !entityType.isBlank()
                ? auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable)
                : auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<AuditLogResponse> content = raw.getContent().stream()
                .map(this::toResponse).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, raw.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getByEntity(String entityType, UUID entityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> raw = auditLogRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable);
        List<AuditLogResponse> content = raw.getContent().stream()
                .map(this::toResponse).collect(Collectors.toList());
        return new PageImpl<>(content, pageable, raw.getTotalElements());
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private AuditLogResponse toResponse(AuditLog log) {
        AuditLogResponse r = new AuditLogResponse();
        r.setId(log.getId());
        r.setActorId(log.getActorId());
        r.setActorEmail(log.getActorEmail());
        r.setAction(log.getAction());
        r.setEntityType(log.getEntityType());
        r.setEntityId(log.getEntityId());
        r.setEntityName(log.getEntityName());
        r.setOldValue(log.getOldValue());
        r.setNewValue(log.getNewValue());
        r.setReason(log.getReason());
        r.setCreatedAt(log.getCreatedAt());
        return r;
    }
}
