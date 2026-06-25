package com.botleague.backend.admin.controller;

import com.botleague.backend.team.dto.RobotResponseDTO;
import com.botleague.backend.team.dto.UpdateRobotRequestDTO;
import com.botleague.backend.team.enums.RobotStatus;
import com.botleague.backend.team.service.RobotService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/robots")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
public class AdminRobotController {

    private final RobotService robotService;

    public AdminRobotController(RobotService robotService) {
        this.robotService = robotService;
    }

    /**
     * Paginated robot list with optional search/filters.
     * GET /api/admin/robots?q=&sport=&status=&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Page<RobotResponseDTO>> listRobots(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sport,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        RobotStatus robotStatus = null;
        if (status != null && !status.isBlank()) {
            try { robotStatus = RobotStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        return ResponseEntity.ok(robotService.getAllRobotsAdmin(q, sport, robotStatus, page, size));
    }

    /**
     * Single robot — full detail including team name/code.
     * GET /api/admin/robots/{robotId}
     */
    @GetMapping("/{robotId}")
    public ResponseEntity<RobotResponseDTO> getRobot(@PathVariable UUID robotId) {
        return ResponseEntity.ok(robotService.getRobotByIdAdmin(robotId));
    }

    /**
     * Partial update — reuses the same UpdateRobotRequestDTO the team uses
     * but without the team-membership ownership check.
     * PUT /api/admin/robots/{robotId}
     */
    @PutMapping("/{robotId}")
    public ResponseEntity<RobotResponseDTO> updateRobot(
            @PathVariable UUID robotId,
            @Valid @RequestBody UpdateRobotRequestDTO request) {
        return ResponseEntity.ok(robotService.updateRobotAdmin(robotId, request));
    }

    /**
     * Change status (ACTIVE / INACTIVE / MAINTENANCE).
     * PATCH /api/admin/robots/{robotId}/status
     */
    @PatchMapping("/{robotId}/status")
    public ResponseEntity<RobotResponseDTO> changeStatus(
            @PathVariable UUID robotId,
            @RequestParam String status) {
        RobotStatus newStatus = RobotStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(robotService.changeRobotStatusAdmin(robotId, newStatus));
    }

    /**
     * Soft-delete (sets deletedAt + status = INACTIVE).
     * DELETE /api/admin/robots/{robotId}
     */
    @DeleteMapping("/{robotId}")
    public ResponseEntity<Void> deleteRobot(@PathVariable UUID robotId) {
        robotService.deleteRobotAdmin(robotId);
        return ResponseEntity.noContent().build();
    }
}
