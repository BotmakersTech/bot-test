package com.botleague.backend.team.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import com.botleague.backend.team.dto.CreateRobotRequestDTO;
import com.botleague.backend.team.dto.CreateRobotResponseDTO;
import com.botleague.backend.team.dto.GetTeamResponseDTO;
import com.botleague.backend.team.dto.MediaRequest;
import com.botleague.backend.team.dto.RobotResponseDTO;
import com.botleague.backend.team.dto.UpdateRobotRequestDTO;
import com.botleague.backend.team.enums.MediaType;
import com.botleague.backend.team.dto.PublicRobotProfileDTO;
import com.botleague.backend.team.service.PublicRobotService;
import com.botleague.backend.team.service.RobotMediaService;
import com.botleague.backend.team.service.RobotService;


import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/robots")
public class RobotController {

	private final RobotService       robotService;
	private final FileKeyService     fileKeyService;
	private final UploadService      uploadService;
	private final RobotMediaService  robotMediaService;
	private final PublicRobotService publicRobotService;

	public RobotController(RobotService robotService, FileKeyService fileKeyService,
	                       UploadService uploadService, RobotMediaService robotMediaService,
	                       PublicRobotService publicRobotService) {
		this.robotService       = robotService;
		this.fileKeyService     = fileKeyService;
		this.uploadService      = uploadService;
		this.robotMediaService  = robotMediaService;
		this.publicRobotService = publicRobotService;
	}

	/** Public robot profile — no authentication required. */
	@GetMapping("/public/{robotId}")
	public ResponseEntity<PublicRobotProfileDTO> getPublicProfile(@PathVariable UUID robotId) {
		return ResponseEntity.ok(publicRobotService.getPublicProfile(robotId));
	}
	@PostMapping("/createRobots")
	public ResponseEntity<CreateRobotResponseDTO> createRobot(Authentication authentication ,@RequestBody CreateRobotRequestDTO request) {
		
		
		CreateRobotResponseDTO response = robotService.createRobot(authentication, request);
		return ResponseEntity.ok(response);
	}
	
	@PatchMapping("/update-robot/{robotId}")
	public ResponseEntity<RobotResponseDTO> updateRobot(
	        Authentication authentication,
	        @PathVariable UUID robotId,
	        @RequestBody @Valid UpdateRobotRequestDTO request
	) {

		RobotResponseDTO response =	robotService.updateRobotData(authentication, robotId, request);

	    return ResponseEntity.ok(response);
	}
	
	
	@GetMapping("/{teamCode}/all-robots")
	public ResponseEntity<List<RobotResponseDTO>> getAllRobotsOfTeam(
	        @PathVariable String teamCode
	) {
	    List<RobotResponseDTO> robots = robotService.getAllRobotsByTeam(teamCode);
	    return ResponseEntity.ok(robots);
	}
	
	@GetMapping("/{robotId}/robot")
	public ResponseEntity<RobotResponseDTO> getRobots(
	        @PathVariable UUID robotId
	) {
	    RobotResponseDTO robots = robotService.getRobotById(robotId);
	    return ResponseEntity.ok(robots);
	}
	
	@DeleteMapping("/{robotId}/delete-robot")
	public ResponseEntity<String> deleteRobots(
			Authentication authentication,
	        @PathVariable UUID robotId
	) {
	    String robot = robotService.deleteRobotById(authentication,robotId);
	    return ResponseEntity.ok(robot);
	}
	
	// =========================
    // Generate Upload URL
    // =========================
	@PostMapping("/{robotId}/upload-url")
	public ResponseEntity<UploadResponse> getRobotUploadUrl(
	        Authentication authentication,
	        @PathVariable UUID robotId,
	        @RequestParam String fileType,
	        @RequestParam long fileSize
	) {

	    UUID userId = UUID.fromString((String) authentication.getPrincipal());

	    String key = fileKeyService.generateRobotImageKey(userId, robotId, fileType);

	    UploadResponse response =
	            uploadService.generateUploadUrl(key, fileType, fileSize);

	    return ResponseEntity.ok(response);
	}

	
	@PostMapping("/{robotId}/media")
	public ResponseEntity<String> confirmUpload(
	        @PathVariable UUID robotId,
	        @RequestBody MediaRequest request
	) {

	    MediaType type = request.getFileType().startsWith("image")
	            ? MediaType.IMAGE
	            : MediaType.VIDEO;

	    robotMediaService.saveMedia(robotId, request.getFileUrl(), type);

	    return ResponseEntity.ok("Media saved");
	}

}
