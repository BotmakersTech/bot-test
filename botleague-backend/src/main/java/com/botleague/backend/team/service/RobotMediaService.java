package com.botleague.backend.team.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.team.entity.Robot;
import com.botleague.backend.team.entity.RobotMedia;
import com.botleague.backend.team.enums.MediaType;
import com.botleague.backend.team.repository.RobotMediaRepository;
import com.botleague.backend.team.repository.RobotRepository;

@Service
public class RobotMediaService {

    private final RobotMediaRepository repository;
    private final RobotRepository robotRepository;
    private final TeamMembershipService teamMembershipService;

    public RobotMediaService(
            RobotMediaRepository repository,
            RobotRepository robotRepository,
            TeamMembershipService teamMembershipService) {
        this.repository = repository;
        this.robotRepository = robotRepository;
        this.teamMembershipService = teamMembershipService;
    }

    /**
     * Confirms an upload the caller just completed to R2 and attaches it to a
     * robot's media list. Two checks close what was previously a wide-open
     * "attach any URL to any robot" endpoint:
     *   1. Caller must be captain/vice-captain of the robot's own team.
     *   2. The key must live inside THIS robot's own generated storage
     *      namespace ("robots/{teamId}/{robotId}/…") — it can't be an
     *      arbitrary external URL or another robot's key.
     */
    public void saveMedia(Authentication authentication, UUID robotId, String key, MediaType mediaType) {

        UUID userId = extractUserId(authentication);

        Robot robot = robotRepository.findByIdAndDeletedAtIsNull(robotId)
                .orElseThrow(() -> ApiException.notFound("Robot not found"));

        teamMembershipService.validateTeamAdmin(userId, robot.getTeamId());

        String expectedPrefix = "robots/" + robot.getTeamId() + "/" + robotId + "/";
        if (key == null || !key.startsWith(expectedPrefix)) {
            throw ApiException.badRequest("Upload key does not belong to this robot");
        }

        RobotMedia media = new RobotMedia();

        media.setRobotId(robotId);
        media.setFileUrl(key);
        media.setMediaType(mediaType);
        media.setCreatedAt(LocalDateTime.now());

        repository.save(media);
    }

    private UUID extractUserId(Authentication authentication) {
        return UUID.fromString((String) authentication.getPrincipal());
    }
}