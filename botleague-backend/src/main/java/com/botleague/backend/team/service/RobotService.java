package com.botleague.backend.team.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.BotleagueIdService;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import com.botleague.backend.team.dto.CreateRobotRequestDTO;
import com.botleague.backend.team.dto.CreateRobotResponseDTO;
import com.botleague.backend.team.dto.RobotResponseDTO;
import com.botleague.backend.team.dto.UpdateRobotRequestDTO;
import com.botleague.backend.team.entity.Robot;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.team.enums.MediaType;
import com.botleague.backend.team.enums.RobotStatus;
import com.botleague.backend.team.repository.RobotMediaRepository;
import com.botleague.backend.team.repository.RobotRepository;
import com.botleague.backend.team.repository.TeamRepository;

@Service
@Transactional
public class RobotService {

    private final RobotRepository robotRepository;
    private final TeamMembershipService teamMembershipService;
    private final BotleagueIdService botLeagueIdService;
    private final FileKeyService fileKeyService;
    private final UploadService uploadService;
    private final TeamRepository teamRepository;
    private final RobotMediaRepository robotMediaRepository;
    private final RobotEligibilityService eligibilityService;
    private final NotificationService notificationService;

    public RobotService(
            RobotRepository robotRepository,
            TeamMembershipService teamMembershipService,
            BotleagueIdService botLeagueIdService,
            FileKeyService fileKeyService,
            UploadService uploadService,
            TeamRepository teamRepository,
            RobotMediaRepository robotMediaRepository,
            RobotEligibilityService eligibilityService,
            NotificationService notificationService) {

        this.robotRepository = robotRepository;
        this.teamMembershipService = teamMembershipService;
        this.botLeagueIdService = botLeagueIdService;
        this.fileKeyService = fileKeyService;
        this.uploadService = uploadService;
        this.teamRepository = teamRepository;
        this.robotMediaRepository = robotMediaRepository;
        this.eligibilityService = eligibilityService;
        this.notificationService = notificationService;
    }

    // ================= CREATE ROBOT =================

    public CreateRobotResponseDTO createRobot(
            Authentication authentication,
            CreateRobotRequestDTO request) {

        UUID userId = extractUserId(authentication);
        UUID teamId = teamMembershipService.getTeamIdByUserId(userId);
        teamMembershipService.validateTeamAdmin(userId, teamId);

        boolean exists = robotRepository
                .existsByTeamIdAndRobotName(teamId, request.getRobotName().trim());

        if (exists) {
            throw ApiException.conflict("Robot name already exists in this team");
        }

        Robot robot = new Robot();
        robot.setRobotCode(botLeagueIdService.generateBotLeagueRobotId());
        robot.setRobotName(request.getRobotName().trim());
        robot.setRobotType(request.getRobotType());
        robot.setSport(request.getSport());
        robot.setDescription(request.getDescription());

        // control - two axes
        robot.setControlType(request.getControlType());
        robot.setControlMode(request.getControlMode());

        // weight + size
        robot.setWeightKg(request.getWeightKg());
        robot.setLengthCm(request.getLengthCm());
        robot.setWidthCm(request.getWidthCm());
        robot.setHeightCm(request.getHeightCm());

        // Weight class: auto-derive for RoboWar sports, else use provided value
        String derivedWeightClass = RobotEligibilityService.weightClassFromSport(request.getSport());
        robot.setWeightClass(derivedWeightClass != null ? derivedWeightClass : request.getWeightClass());

        // sport-specific attributes (weaponType, droneType, vehicleType, …)
        if (request.getAttributes() != null) {
            robot.setAttributes(request.getAttributes());
        }

        // Compute eligible age categories and store the primary for backward compat
        AgeCategory primary = eligibilityService.primaryCategory(
                request.getSport(),
                request.getWeightKg(),
                request.getLengthCm(),
                request.getWidthCm(),
                request.getHeightCm());

        // Fall back to JUNIOR_INNOVATORS if no eligibility rule matched (should not happen with valid sport)
        robot.setAgeCategory(primary != null ? primary : AgeCategory.JUNIOR_INNOVATORS);

        robot.setStatus(RobotStatus.ACTIVE);
        robot.setTeamId(teamId);

        Robot saved = robotRepository.save(robot);

        notificationService.teamNotifyExcluding(
                teamId, userId,
                "New Robot Registered",
                "\"" + saved.getRobotName() + "\" has been added to the team's robot roster.",
                NotificationType.ROBOT_ADDED,
                NotificationPriority.MEDIUM,
                "/robots");

        CreateRobotResponseDTO response = new CreateRobotResponseDTO();
        response.setId(saved.getId());
        response.setRobotCode(saved.getRobotCode());
        response.setRobotName(saved.getRobotName());
        response.setStatus(saved.getStatus());
        return response;
    }

    // ================= UPDATE ROBOT =================

    public RobotResponseDTO updateRobotData(
            Authentication authentication,
            UUID robotId,
            UpdateRobotRequestDTO request) {

        UUID userId = extractUserId(authentication);

        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));

        teamMembershipService.validateTeamAdmin(userId, robot.getTeamId());

        if (request.getRobotName() != null && !request.getRobotName().trim().isEmpty()) {
            boolean exists = robotRepository
                    .existsByTeamIdAndRobotName(robot.getTeamId(), request.getRobotName().trim());

            if (exists && !robot.getRobotName().equalsIgnoreCase(request.getRobotName().trim())) {
                throw ApiException.conflict("Robot name already exists");
            }
            robot.setRobotName(request.getRobotName().trim());
        }

        if (request.getRobotType() != null) robot.setRobotType(request.getRobotType());
        if (request.getSport() != null)     robot.setSport(request.getSport());
        if (request.getControlType() != null) robot.setControlType(request.getControlType());
        if (request.getControlMode() != null) robot.setControlMode(request.getControlMode());
        if (request.getWeightKg() != null)  robot.setWeightKg(request.getWeightKg());
        if (request.getLengthCm() != null)  robot.setLengthCm(request.getLengthCm());
        if (request.getWidthCm() != null)   robot.setWidthCm(request.getWidthCm());
        if (request.getHeightCm() != null)  robot.setHeightCm(request.getHeightCm());
        if (request.getAttributes() != null) robot.setAttributes(request.getAttributes());
        if (request.getDescription() != null) robot.setDescription(request.getDescription());
        if (request.getStatus() != null)    robot.setStatus(request.getStatus());

        // Keep weightClass in sync
        String sport = robot.getSport();
        if (sport != null) {
            String derived = RobotEligibilityService.weightClassFromSport(sport);
            if (derived != null) {
                robot.setWeightClass(derived);
            } else if (request.getWeightClass() != null) {
                robot.setWeightClass(request.getWeightClass());
            }
        }

        // Recompute age category whenever relevant fields change
        AgeCategory primary = eligibilityService.primaryCategory(
                robot.getSport(),
                robot.getWeightKg(),
                robot.getLengthCm(),
                robot.getWidthCm(),
                robot.getHeightCm());
        if (primary != null) {
            robot.setAgeCategory(primary);
        }

        Robot updated = robotRepository.save(robot);

        notificationService.teamNotifyExcluding(
                updated.getTeamId(), userId,
                "Robot Updated",
                "\"" + updated.getRobotName() + "\" specifications have been updated.",
                NotificationType.ROBOT_UPDATED,
                NotificationPriority.LOW,
                "/robots");

        return mapRobot(updated);
    }

    // ================= GET ALL ROBOTS BY TEAM =================

    @Transactional(readOnly = true)
    public List<RobotResponseDTO> getAllRobotsByTeam(String teamCode) {

        Team team = teamRepository.findByTeamCode(teamCode)
                .orElseThrow(() -> ApiException.notFound("Team not found"));

        return robotRepository.findByTeamIdAndDeletedAtIsNull(team.getId())
                .stream()
                .map(this::mapRobot)
                .toList();
    }

    // ================= GET ONE ROBOT =================

    @Transactional(readOnly = true)
    public RobotResponseDTO getRobotById(UUID robotId) {

        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));

        return mapRobot(robot);
    }

    // ================= DELETE ROBOT =================

    public String deleteRobotById(Authentication authentication, UUID robotId) {

        UUID userId = extractUserId(authentication);

        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));

        teamMembershipService.validateTeamAdmin(userId, robot.getTeamId());

        String robotName = robot.getRobotName();
        UUID teamId = robot.getTeamId();

        robot.setDeletedAt(LocalDateTime.now());
        robot.setStatus(RobotStatus.INACTIVE);
        robotRepository.save(robot);

        notificationService.teamNotifyExcluding(
                teamId, userId,
                "Robot Removed",
                "\"" + robotName + "\" has been removed from the team's robot roster.",
                NotificationType.ROBOT_DELETED,
                NotificationPriority.MEDIUM,
                "/robots");

        return "Robot deleted successfully";
    }

    // ================= UPLOAD ROBOT MEDIA =================

    public UploadResponse uploadRobot(
            Authentication authentication,
            UUID robotId,
            String fileType,
            long fileSize) {

        UUID userId = extractUserId(authentication);

        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));

        teamMembershipService.validateTeamAdmin(userId, robot.getTeamId());

        String key;
        if (fileType.startsWith("image")) {
            key = fileKeyService.generateRobotImageKey(robot.getTeamId(), robotId, fileType);
        } else if (fileType.startsWith("video")) {
            key = fileKeyService.generateRobotVideoKey(robot.getTeamId(), robotId, fileType);
        } else {
            throw ApiException.badRequest("Unsupported file type");
        }

        return uploadService.generateUploadUrl(key, fileType, fileSize);
    }

    // ================= ADMIN OPERATIONS =================

    @Transactional(readOnly = true)
    public Page<RobotResponseDTO> getAllRobotsAdmin(String q, String sport, RobotStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return robotRepository.searchAdmin(
                (q != null && !q.isBlank()) ? q.trim() : "",
                (sport != null && !sport.isBlank()) ? sport.trim() : "",
                status,
                pageable
        ).map(this::mapRobotWithTeam);
    }

    @Transactional(readOnly = true)
    public RobotResponseDTO getRobotByIdAdmin(UUID robotId) {
        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));
        return mapRobotWithTeam(robot);
    }

    public RobotResponseDTO changeRobotStatusAdmin(UUID robotId, RobotStatus newStatus) {
        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));
        robot.setStatus(newStatus);
        return mapRobotWithTeam(robotRepository.save(robot));
    }

    public RobotResponseDTO updateRobotAdmin(UUID robotId, UpdateRobotRequestDTO request) {
        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));

        if (request.getRobotName() != null && !request.getRobotName().isBlank())
            robot.setRobotName(request.getRobotName().trim());
        if (request.getRobotType()   != null) robot.setRobotType(request.getRobotType());
        if (request.getSport()       != null) robot.setSport(request.getSport());
        if (request.getControlType() != null) robot.setControlType(request.getControlType());
        if (request.getControlMode() != null) robot.setControlMode(request.getControlMode());
        if (request.getWeightKg()    != null) robot.setWeightKg(request.getWeightKg());
        if (request.getLengthCm()    != null) robot.setLengthCm(request.getLengthCm());
        if (request.getWidthCm()     != null) robot.setWidthCm(request.getWidthCm());
        if (request.getHeightCm()    != null) robot.setHeightCm(request.getHeightCm());
        if (request.getAttributes()  != null) robot.setAttributes(request.getAttributes());
        if (request.getDescription() != null) robot.setDescription(request.getDescription());

        String derived = RobotEligibilityService.weightClassFromSport(robot.getSport());
        if (derived != null) robot.setWeightClass(derived);
        else if (request.getWeightClass() != null) robot.setWeightClass(request.getWeightClass());

        AgeCategory primary = eligibilityService.primaryCategory(
                robot.getSport(), robot.getWeightKg(),
                robot.getLengthCm(), robot.getWidthCm(), robot.getHeightCm());
        if (primary != null) robot.setAgeCategory(primary);

        return mapRobotWithTeam(robotRepository.save(robot));
    }

    public void deleteRobotAdmin(UUID robotId) {
        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));
        robot.setDeletedAt(java.time.LocalDateTime.now());
        robot.setStatus(RobotStatus.INACTIVE);
        robotRepository.save(robot);
    }

    // ================= HELPERS =================

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }

    private RobotResponseDTO mapRobotWithTeam(Robot robot) {
        RobotResponseDTO dto = mapRobot(robot);
        teamRepository.findById(robot.getTeamId()).ifPresent(t -> {
            dto.setTeamName(t.getTeamName());
            dto.setTeamCode(t.getTeamCode());
        });
        return dto;
    }

    private RobotResponseDTO mapRobot(Robot robot) {
        RobotResponseDTO dto = new RobotResponseDTO();
        dto.setId(robot.getId());
        dto.setRobotCode(robot.getRobotCode());
        dto.setRobotName(robot.getRobotName());
        dto.setRobotType(robot.getRobotType());
        dto.setSport(robot.getSport());
        dto.setControlType(robot.getControlType());
        dto.setControlMode(robot.getControlMode());
        dto.setWeightClass(robot.getWeightClass());
        dto.setWeightKg(robot.getWeightKg());
        dto.setLengthCm(robot.getLengthCm());
        dto.setWidthCm(robot.getWidthCm());
        dto.setHeightCm(robot.getHeightCm());
        dto.setAttributes(robot.getAttributes());
        dto.setDescription(robot.getDescription());
        dto.setStatus(robot.getStatus());
        dto.setTeamId(robot.getTeamId());
        dto.setCreatedAt(robot.getCreatedAt());

        // Compute eligible categories at read time for fresh results
        dto.setEligibleCategories(eligibilityService.computeEligibleCategories(
                robot.getSport(),
                robot.getWeightKg(),
                robot.getLengthCm(),
                robot.getWidthCm(),
                robot.getHeightCm()));

        robotMediaRepository
                .findFirstByRobotIdAndMediaTypeOrderByCreatedAtDesc(robot.getId(), MediaType.IMAGE)
                .ifPresent(media ->
                        dto.setRobotIMG("https://media.botleague.in/" + media.getFileUrl()));

        return dto;
    }
}
