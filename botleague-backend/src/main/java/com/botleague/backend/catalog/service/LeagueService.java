package com.botleague.backend.catalog.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.audit.util.AuditDiff;
import com.botleague.backend.catalog.dto.CreateLeagueRequest;
import com.botleague.backend.catalog.dto.LeagueResponse;
import com.botleague.backend.catalog.dto.UpdateLeagueRequest;
import com.botleague.backend.catalog.entity.League;
import com.botleague.backend.catalog.repository.LeagueRepository;
import com.botleague.backend.common.exception.ApiException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * CRUD for League (Ignite/Inferno/Apex, or any future tier an admin adds).
 * Mirrors CertificateTypeService's shape: @Transactional mutations, manual
 * string-status validation, AuditLogService.log(...) on every mutation.
 */
@Service
public class LeagueService {

    private final LeagueRepository leagueRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public LeagueService(LeagueRepository leagueRepository, AuditLogService auditLogService, ObjectMapper objectMapper) {
        this.leagueRepository = leagueRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public LeagueResponse create(CreateLeagueRequest req, UUID callerId) {
        if (req.getSlug() == null || req.getSlug().isBlank()) {
            throw ApiException.badRequest("Slug is required");
        }
        if (req.getAgeGroupCode() == null || req.getAgeGroupCode().isBlank()) {
            throw ApiException.badRequest("Age group code is required");
        }
        if (req.getName() == null || req.getName().isBlank()) {
            throw ApiException.badRequest("Name is required");
        }
        String slug = req.getSlug().trim().toLowerCase();
        String ageGroupCode = req.getAgeGroupCode().trim().toUpperCase();
        if (leagueRepository.existsBySlug(slug)) {
            throw ApiException.conflict("A league with this slug already exists");
        }
        if (leagueRepository.existsByAgeGroupCode(ageGroupCode)) {
            throw ApiException.conflict("A league with this age group code already exists");
        }
        if (req.getNextLeagueId() != null && !leagueRepository.existsById(req.getNextLeagueId())) {
            throw ApiException.badRequest("nextLeagueId does not reference an existing league");
        }

        League league = new League();
        league.setSlug(slug);
        league.setAgeGroupCode(ageGroupCode);
        league.setName(req.getName().trim());
        league.setMinAge(req.getMinAge());
        league.setMaxAge(req.getMaxAge());
        league.setTagline(req.getTagline());
        league.setDescription(req.getDescription());
        league.setPrimaryColor(req.getPrimaryColor());
        league.setSecondaryColor(req.getSecondaryColor());
        league.setWhatYouGetJson(toJson(req.getWhatYouGet()));
        league.setRankingScope(req.getRankingScope());
        league.setNextLeagueId(req.getNextLeagueId());
        if (req.getDisplayOrder() != null) league.setDisplayOrder(req.getDisplayOrder());
        league.setCreatedBy(callerId);

        League saved = leagueRepository.save(league);
        auditLogService.log("LEAGUE_CREATED", "LEAGUE", saved.getId(), saved.getName(), null, null);
        return toResponse(saved);
    }

    @Transactional
    public LeagueResponse update(UUID id, UpdateLeagueRequest req) {
        League league = getEntity(id);

        String oldSlug = league.getSlug();
        String oldAgeGroupCode = league.getAgeGroupCode();
        String oldName = league.getName();
        String oldStatus = league.getStatus();
        Integer oldMinAge = league.getMinAge();
        Integer oldMaxAge = league.getMaxAge();

        if (req.getSlug() != null && !req.getSlug().isBlank()) {
            String slug = req.getSlug().trim().toLowerCase();
            if (!slug.equals(league.getSlug()) && leagueRepository.existsBySlug(slug)) {
                throw ApiException.conflict("A league with this slug already exists");
            }
            league.setSlug(slug);
        }
        if (req.getAgeGroupCode() != null && !req.getAgeGroupCode().isBlank()) {
            String ageGroupCode = req.getAgeGroupCode().trim().toUpperCase();
            if (!ageGroupCode.equals(league.getAgeGroupCode()) && leagueRepository.existsByAgeGroupCode(ageGroupCode)) {
                throw ApiException.conflict("A league with this age group code already exists");
            }
            league.setAgeGroupCode(ageGroupCode);
        }
        if (req.getName() != null && !req.getName().isBlank()) {
            league.setName(req.getName().trim());
        }
        if (req.getMinAge() != null) league.setMinAge(req.getMinAge());
        if (req.getMaxAge() != null) league.setMaxAge(req.getMaxAge());
        if (req.getTagline() != null) league.setTagline(req.getTagline());
        if (req.getDescription() != null) league.setDescription(req.getDescription());
        if (req.getPrimaryColor() != null) league.setPrimaryColor(req.getPrimaryColor());
        if (req.getSecondaryColor() != null) league.setSecondaryColor(req.getSecondaryColor());
        if (req.getWhatYouGet() != null) league.setWhatYouGetJson(toJson(req.getWhatYouGet()));
        if (req.getRankingScope() != null) league.setRankingScope(req.getRankingScope());
        if (req.getNextLeagueId() != null) {
            if (!leagueRepository.existsById(req.getNextLeagueId())) {
                throw ApiException.badRequest("nextLeagueId does not reference an existing league");
            }
            league.setNextLeagueId(req.getNextLeagueId());
        }
        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
            league.setStatus(req.getStatus());
        }
        if (req.getDisplayOrder() != null) league.setDisplayOrder(req.getDisplayOrder());

        League saved = leagueRepository.save(league);

        AuditDiff diff = new AuditDiff()
                .field("slug", oldSlug, saved.getSlug())
                .field("ageGroupCode", oldAgeGroupCode, saved.getAgeGroupCode())
                .field("name", oldName, saved.getName())
                .field("minAge", oldMinAge, saved.getMinAge())
                .field("maxAge", oldMaxAge, saved.getMaxAge())
                .field("status", oldStatus, saved.getStatus());
        auditLogService.log("LEAGUE_UPDATED", "LEAGUE", saved.getId(), saved.getName(), diff.oldValue(), diff.newValue());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LeagueResponse> listAll() {
        return leagueRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeagueResponse> listActive() {
        return leagueRepository.findByStatusOrderByDisplayOrderAsc(League.STATUS_ACTIVE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeagueResponse get(UUID id) {
        return toResponse(getEntity(id));
    }

    @Transactional(readOnly = true)
    public LeagueResponse getBySlug(String slug) {
        League league = leagueRepository.findBySlug(slug)
                .orElseThrow(() -> ApiException.notFound("League not found"));
        return toResponse(league);
    }

    /** Public-facing lookup — only ever returns an ACTIVE league. */
    @Transactional(readOnly = true)
    public LeagueResponse getActiveBySlug(String slug) {
        return toResponse(getActiveEntityBySlug(slug));
    }

    @Transactional(readOnly = true)
    public League getEntity(UUID id) {
        return leagueRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("League not found"));
    }

    @Transactional(readOnly = true)
    public League getActiveEntityBySlug(String slug) {
        League league = leagueRepository.findBySlug(slug)
                .orElseThrow(() -> ApiException.notFound("League not found"));
        if (!League.STATUS_ACTIVE.equals(league.getStatus())) {
            throw ApiException.notFound("League not found");
        }
        return league;
    }

    /** Used by EventSportsService in place of the old AgeCategory.valueOf(...). */
    @Transactional(readOnly = true)
    public String validateAgeGroupCode(String code) {
        if (code == null || code.isBlank()) {
            throw ApiException.badRequest("AgeGroup is required");
        }
        String normalized = code.trim().toUpperCase();
        League league = leagueRepository.findByAgeGroupCode(normalized)
                .orElseThrow(() -> ApiException.badRequest("Unknown age group: " + code));
        if (!League.STATUS_ACTIVE.equals(league.getStatus())) {
            throw ApiException.badRequest("This league is currently disabled: " + code);
        }
        return normalized;
    }

    private void validateStatus(String status) {
        boolean valid = League.STATUS_ACTIVE.equals(status) || League.STATUS_DISABLED.equals(status);
        if (!valid) {
            throw ApiException.badRequest("Invalid league status: " + status);
        }
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            throw ApiException.badRequest("Could not serialize whatYouGet");
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private LeagueResponse toResponse(League league) {
        LeagueResponse dto = new LeagueResponse();
        dto.setId(league.getId());
        dto.setSlug(league.getSlug());
        dto.setAgeGroupCode(league.getAgeGroupCode());
        dto.setName(league.getName());
        dto.setMinAge(league.getMinAge());
        dto.setMaxAge(league.getMaxAge());
        dto.setTagline(league.getTagline());
        dto.setDescription(league.getDescription());
        dto.setPrimaryColor(league.getPrimaryColor());
        dto.setSecondaryColor(league.getSecondaryColor());
        dto.setWhatYouGet(fromJson(league.getWhatYouGetJson()));
        dto.setRankingScope(league.getRankingScope());
        dto.setNextLeagueId(league.getNextLeagueId());
        dto.setStatus(league.getStatus());
        dto.setDisplayOrder(league.getDisplayOrder());
        dto.setCreatedAt(league.getCreatedAt());
        dto.setUpdatedAt(league.getUpdatedAt());
        return dto;
    }
}
