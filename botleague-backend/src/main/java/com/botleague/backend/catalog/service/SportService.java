package com.botleague.backend.catalog.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.audit.util.AuditDiff;
import com.botleague.backend.catalog.dto.CreateSportRequest;
import com.botleague.backend.catalog.dto.SportResponse;
import com.botleague.backend.catalog.dto.UpdateSportRequest;
import com.botleague.backend.catalog.entity.Sport;
import com.botleague.backend.catalog.repository.SportRepository;
import com.botleague.backend.common.exception.ApiException;

/** CRUD for the reusable Sport identity (e.g. "Robo War"). */
@Service
public class SportService {

    private final SportRepository sportRepository;
    private final AuditLogService auditLogService;

    public SportService(SportRepository sportRepository, AuditLogService auditLogService) {
        this.sportRepository = sportRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public SportResponse create(CreateSportRequest req, UUID callerId) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw ApiException.badRequest("Name is required");
        }
        if (req.getSlug() == null || req.getSlug().isBlank()) {
            throw ApiException.badRequest("Slug is required");
        }
        String slug = req.getSlug().trim().toLowerCase();
        if (sportRepository.existsBySlug(slug)) {
            throw ApiException.conflict("A sport with this slug already exists");
        }

        Sport sport = new Sport();
        sport.setName(req.getName().trim());
        sport.setSlug(slug);
        sport.setCompetitionTypeHint(req.getCompetitionTypeHint());
        sport.setDescription(req.getDescription());
        sport.setIconUrl(req.getIconUrl());
        if (req.getDisplayOrder() != null) sport.setDisplayOrder(req.getDisplayOrder());
        sport.setCreatedBy(callerId);

        Sport saved = sportRepository.save(sport);
        auditLogService.log("SPORT_CREATED", "SPORT", saved.getId(), saved.getName(), null, null);
        return toResponse(saved);
    }

    @Transactional
    public SportResponse update(UUID id, UpdateSportRequest req) {
        Sport sport = getEntity(id);

        String oldName = sport.getName();
        String oldSlug = sport.getSlug();
        String oldStatus = sport.getStatus();

        if (req.getName() != null && !req.getName().isBlank()) {
            sport.setName(req.getName().trim());
        }
        if (req.getSlug() != null && !req.getSlug().isBlank()) {
            String slug = req.getSlug().trim().toLowerCase();
            if (!slug.equals(sport.getSlug()) && sportRepository.existsBySlug(slug)) {
                throw ApiException.conflict("A sport with this slug already exists");
            }
            sport.setSlug(slug);
        }
        if (req.getCompetitionTypeHint() != null) sport.setCompetitionTypeHint(req.getCompetitionTypeHint());
        if (req.getDescription() != null) sport.setDescription(req.getDescription());
        if (req.getIconUrl() != null) sport.setIconUrl(req.getIconUrl());
        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
            sport.setStatus(req.getStatus());
        }
        if (req.getDisplayOrder() != null) sport.setDisplayOrder(req.getDisplayOrder());

        Sport saved = sportRepository.save(sport);

        AuditDiff diff = new AuditDiff()
                .field("name", oldName, saved.getName())
                .field("slug", oldSlug, saved.getSlug())
                .field("status", oldStatus, saved.getStatus());
        auditLogService.log("SPORT_UPDATED", "SPORT", saved.getId(), saved.getName(), diff.oldValue(), diff.newValue());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SportResponse> listAll() {
        return sportRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SportResponse> listActive() {
        return sportRepository.findByStatusOrderByDisplayOrderAsc(Sport.STATUS_ACTIVE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SportResponse get(UUID id) {
        return toResponse(getEntity(id));
    }

    @Transactional(readOnly = true)
    public Sport getEntity(UUID id) {
        return sportRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Sport not found"));
    }

    private void validateStatus(String status) {
        boolean valid = Sport.STATUS_ACTIVE.equals(status) || Sport.STATUS_DISABLED.equals(status);
        if (!valid) {
            throw ApiException.badRequest("Invalid sport status: " + status);
        }
    }

    private SportResponse toResponse(Sport sport) {
        SportResponse dto = new SportResponse();
        dto.setId(sport.getId());
        dto.setName(sport.getName());
        dto.setSlug(sport.getSlug());
        dto.setCompetitionTypeHint(sport.getCompetitionTypeHint());
        dto.setDescription(sport.getDescription());
        dto.setIconUrl(sport.getIconUrl());
        dto.setStatus(sport.getStatus());
        dto.setDisplayOrder(sport.getDisplayOrder());
        dto.setCreatedAt(sport.getCreatedAt());
        dto.setUpdatedAt(sport.getUpdatedAt());
        return dto;
    }
}
