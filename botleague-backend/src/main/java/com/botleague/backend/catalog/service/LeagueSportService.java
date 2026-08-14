package com.botleague.backend.catalog.service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.audit.util.AuditDiff;
import com.botleague.backend.catalog.dto.CreateLeagueSportRequest;
import com.botleague.backend.catalog.dto.LeagueSportResponse;
import com.botleague.backend.catalog.dto.UpdateLeagueSportRequest;
import com.botleague.backend.catalog.dto.WeightClassDTO;
import com.botleague.backend.catalog.entity.League;
import com.botleague.backend.catalog.entity.LeagueSport;
import com.botleague.backend.catalog.entity.Sport;
import com.botleague.backend.catalog.repository.LeagueRepository;
import com.botleague.backend.catalog.repository.LeagueSportRepository;
import com.botleague.backend.catalog.repository.SportRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.team.enums.ControlMode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * CRUD for a Sport's specs *within* one League — including the DRAFT/LIVE
 * gate that controls whether organisers can pick this pairing.
 */
@Service
public class LeagueSportService {

    private final LeagueSportRepository leagueSportRepository;
    private final LeagueRepository leagueRepository;
    private final SportRepository sportRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public LeagueSportService(LeagueSportRepository leagueSportRepository,
                               LeagueRepository leagueRepository,
                               SportRepository sportRepository,
                               AuditLogService auditLogService,
                               ObjectMapper objectMapper) {
        this.leagueSportRepository = leagueSportRepository;
        this.leagueRepository = leagueRepository;
        this.sportRepository = sportRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public LeagueSportResponse create(CreateLeagueSportRequest req, UUID callerId) {
        if (req.getLeagueId() == null || req.getSportId() == null) {
            throw ApiException.badRequest("leagueId and sportId are required");
        }
        League league = leagueRepository.findById(req.getLeagueId())
                .orElseThrow(() -> ApiException.notFound("League not found"));
        Sport sport = sportRepository.findById(req.getSportId())
                .orElseThrow(() -> ApiException.notFound("Sport not found"));
        if (leagueSportRepository.existsByLeagueIdAndSportId(req.getLeagueId(), req.getSportId())) {
            throw ApiException.conflict("This sport is already paired with this league");
        }

        LeagueSport entity = new LeagueSport();
        entity.setLeagueId(league.getId());
        entity.setSportId(sport.getId());
        applyFields(entity, req.getWeightLimitKg(), req.getMaxLengthCm(), req.getMaxWidthCm(), req.getMaxHeightCm(),
                req.getControlType(), req.getMaxBotsPerTeam(), req.getWeightClasses(), req.getExtraSpecs(), req.getEntryNote());
        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
            entity.setStatus(req.getStatus());
        }
        if (req.getDisplayOrder() != null) entity.setDisplayOrder(req.getDisplayOrder());
        entity.setCreatedBy(callerId);

        LeagueSport saved = leagueSportRepository.save(entity);
        auditLogService.log("LEAGUE_SPORT_CREATED", "LEAGUE_SPORT", saved.getId(),
                league.getName() + " / " + sport.getName(), null, null);
        return toResponse(saved, league, sport);
    }

    @Transactional
    public LeagueSportResponse update(UUID id, UpdateLeagueSportRequest req) {
        LeagueSport entity = getEntity(id);
        League league = leagueRepository.findById(entity.getLeagueId())
                .orElseThrow(() -> ApiException.notFound("League not found"));
        Sport sport = sportRepository.findById(entity.getSportId())
                .orElseThrow(() -> ApiException.notFound("Sport not found"));

        String oldStatus = entity.getStatus();
        Double oldWeightLimitKg = entity.getWeightLimitKg();
        String oldEntryNote = entity.getEntryNote();

        if (req.getWeightLimitKg() != null) entity.setWeightLimitKg(req.getWeightLimitKg());
        if (req.getMaxLengthCm() != null) entity.setMaxLengthCm(req.getMaxLengthCm());
        if (req.getMaxWidthCm() != null) entity.setMaxWidthCm(req.getMaxWidthCm());
        if (req.getMaxHeightCm() != null) entity.setMaxHeightCm(req.getMaxHeightCm());
        if (req.getControlType() != null) entity.setControlType(parseControlType(req.getControlType()));
        if (req.getMaxBotsPerTeam() != null) entity.setMaxBotsPerTeam(req.getMaxBotsPerTeam());
        if (req.getWeightClasses() != null) entity.setWeightClassesJson(toJson(req.getWeightClasses()));
        if (req.getExtraSpecs() != null) entity.setExtraSpecs(req.getExtraSpecs());
        if (req.getEntryNote() != null) entity.setEntryNote(req.getEntryNote());
        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
            entity.setStatus(req.getStatus());
        }
        if (req.getDisplayOrder() != null) entity.setDisplayOrder(req.getDisplayOrder());

        LeagueSport saved = leagueSportRepository.save(entity);

        AuditDiff diff = new AuditDiff()
                .field("status", oldStatus, saved.getStatus())
                .field("weightLimitKg", oldWeightLimitKg, saved.getWeightLimitKg())
                .field("entryNote", oldEntryNote, saved.getEntryNote());
        auditLogService.log("LEAGUE_SPORT_UPDATED", "LEAGUE_SPORT", saved.getId(),
                league.getName() + " / " + sport.getName(), diff.oldValue(), diff.newValue());
        return toResponse(saved, league, sport);
    }

    @Transactional(readOnly = true)
    public List<LeagueSportResponse> listAll() {
        return leagueSportRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(this::toResponseWithLookup).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeagueSportResponse> listByLeague(UUID leagueId) {
        return leagueSportRepository.findByLeagueIdOrderByDisplayOrderAsc(leagueId)
                .stream().map(this::toResponseWithLookup).collect(Collectors.toList());
    }

    /** Only LIVE pairings — the direct replacement for the old SPORT_SPEC_PRESETS lookup. */
    @Transactional(readOnly = true)
    public List<LeagueSportResponse> listLiveByLeagueSlug(String leagueSlug) {
        League league = leagueRepository.findBySlug(leagueSlug)
                .orElseThrow(() -> ApiException.notFound("League not found"));
        if (!League.STATUS_ACTIVE.equals(league.getStatus())) {
            throw ApiException.notFound("League not found");
        }
        return leagueSportRepository.findByLeagueIdAndStatusOrderByDisplayOrderAsc(league.getId(), LeagueSport.STATUS_LIVE)
                .stream().map(this::toResponseWithLookup).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeagueSportResponse get(UUID id) {
        return toResponseWithLookup(getEntity(id));
    }

    @Transactional(readOnly = true)
    public LeagueSport getEntity(UUID id) {
        return leagueSportRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("League/Sport pairing not found"));
    }

    private void applyFields(LeagueSport entity, Double weightLimitKg, Double maxLengthCm, Double maxWidthCm,
                              Double maxHeightCm, String controlType, Integer maxBotsPerTeam,
                              List<WeightClassDTO> weightClasses, Map<String, String> extraSpecs, String entryNote) {
        entity.setWeightLimitKg(weightLimitKg);
        entity.setMaxLengthCm(maxLengthCm);
        entity.setMaxWidthCm(maxWidthCm);
        entity.setMaxHeightCm(maxHeightCm);
        if (controlType != null && !controlType.isBlank()) {
            entity.setControlType(parseControlType(controlType));
        }
        entity.setMaxBotsPerTeam(maxBotsPerTeam);
        if (weightClasses != null) entity.setWeightClassesJson(toJson(weightClasses));
        if (extraSpecs != null) entity.setExtraSpecs(extraSpecs);
        entity.setEntryNote(entryNote);
    }

    private ControlMode parseControlType(String value) {
        try {
            return ControlMode.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid control type: " + value);
        }
    }

    private void validateStatus(String status) {
        boolean valid = LeagueSport.STATUS_DRAFT.equals(status) || LeagueSport.STATUS_LIVE.equals(status);
        if (!valid) {
            throw ApiException.badRequest("Invalid league/sport status: " + status);
        }
    }

    private String toJson(List<WeightClassDTO> weightClasses) {
        if (weightClasses == null || weightClasses.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(weightClasses);
        } catch (Exception e) {
            throw ApiException.badRequest("Could not serialize weight classes");
        }
    }

    private List<WeightClassDTO> fromJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<WeightClassDTO>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private LeagueSportResponse toResponseWithLookup(LeagueSport entity) {
        League league = leagueRepository.findById(entity.getLeagueId()).orElse(null);
        Sport sport = sportRepository.findById(entity.getSportId()).orElse(null);
        return toResponse(entity, league, sport);
    }

    private LeagueSportResponse toResponse(LeagueSport entity, League league, Sport sport) {
        LeagueSportResponse dto = new LeagueSportResponse();
        dto.setId(entity.getId());
        dto.setLeagueId(entity.getLeagueId());
        if (league != null) {
            dto.setLeagueSlug(league.getSlug());
            dto.setLeagueName(league.getName());
        }
        dto.setSportId(entity.getSportId());
        if (sport != null) {
            dto.setSportSlug(sport.getSlug());
            dto.setSportName(sport.getName());
        }
        dto.setWeightLimitKg(entity.getWeightLimitKg());
        dto.setMaxLengthCm(entity.getMaxLengthCm());
        dto.setMaxWidthCm(entity.getMaxWidthCm());
        dto.setMaxHeightCm(entity.getMaxHeightCm());
        if (entity.getControlType() != null) dto.setControlType(entity.getControlType().name());
        dto.setMaxBotsPerTeam(entity.getMaxBotsPerTeam());
        dto.setWeightClasses(fromJson(entity.getWeightClassesJson()));
        dto.setExtraSpecs(entity.getExtraSpecs());
        dto.setEntryNote(entity.getEntryNote());
        dto.setStatus(entity.getStatus());
        dto.setDisplayOrder(entity.getDisplayOrder());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
