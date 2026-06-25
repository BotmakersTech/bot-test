package com.botleague.backend.team.controller;

import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import com.botleague.backend.team.dto.CreateTeamRequestDTO;
import com.botleague.backend.team.dto.CreateTeamResponseDTO;
import com.botleague.backend.team.dto.GetTeamMembersDTO;
import com.botleague.backend.team.dto.GetTeamResponseDTO;
import com.botleague.backend.team.dto.UpdateTeamRequestDTO;
import com.botleague.backend.team.dto.PublicTeamProfileDTO;
import com.botleague.backend.team.service.PublicTeamService;
import com.botleague.backend.team.service.TeamService;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private static final Logger log = LoggerFactory.getLogger(TeamController.class);

    private final TeamService       teamService;
    private final FileKeyService    fileKeyService;
    private final UploadService     uploadService;
    private final PublicTeamService publicTeamService;

    public TeamController(TeamService teamService, FileKeyService fileKeyService,
                          UploadService uploadService, PublicTeamService publicTeamService) {
        this.teamService       = teamService;
        this.fileKeyService    = fileKeyService;
        this.uploadService     = uploadService;
        this.publicTeamService = publicTeamService;
    }

    /** Public team profile — no authentication required. */
    @GetMapping("/public/{teamId}")
    public ResponseEntity<PublicTeamProfileDTO> getPublicProfile(@PathVariable UUID teamId) {
        return ResponseEntity.ok(publicTeamService.getPublicProfile(teamId));
    }

    @PostMapping("/createTeam")
    public ResponseEntity<CreateTeamResponseDTO> createTeam(
            @Valid @RequestBody CreateTeamRequestDTO request,
            Authentication authentication) {

        CreateTeamResponseDTO response = teamService.createTeam(authentication, request);
        log.info("Team created: {}", response.getTeamCode());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/updateTeam")
    public ResponseEntity<GetTeamResponseDTO> updateTeam(
            Authentication authentication,
            @RequestBody UpdateTeamRequestDTO request) {

        return ResponseEntity.ok(teamService.updateTeam(authentication, request));
    }
    

    @GetMapping("/{teamId}/members")
    public ResponseEntity<GetTeamMembersDTO> getTeamMembers(
            @PathVariable String teamId) {

        GetTeamMembersDTO response = teamService.getTeamMembers(teamId);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/upload/{teamId}/logo")
    public ResponseEntity<UploadResponse> getTeamLogoUploadUrl(

            @PathVariable UUID teamId,

            Authentication authentication,

            @RequestParam String fileType,

            @RequestParam long fileSize
    ) {

        // Generate unique storage key
        String key =
                fileKeyService.generateTeamLogoKey(teamId,fileType);

        // Generate presigned upload URL
        UploadResponse response =
                uploadService.generateUploadUrl(
                        key,
                        fileType,
                        fileSize
                );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/leaveTeam")
    public ResponseEntity<String> leaveTeam(Authentication authentication) {
        String response = teamService.leaveTeam(authentication);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getTeam/{botLeagueTeamId}")
    public ResponseEntity<GetTeamResponseDTO> getTeam(
            @PathVariable String botLeagueTeamId) {

        GetTeamResponseDTO response = teamService.getTeam(botLeagueTeamId);
        return ResponseEntity.ok(response);
    }
   
    @GetMapping("/getTeam/my")
    public ResponseEntity<GetTeamResponseDTO> getCurrentUserTeam(Authentication authentication) {
    	
        return ResponseEntity.ok(teamService.getTeamOfCurrentUser(authentication));
    }
    
    @PostMapping("/logo")
    public ResponseEntity<String> saveTeamPhoto(

            Authentication authentication,

            @RequestBody Map<String, String> body

    ) {

        String fileUrl = body.get("key");

        if (fileUrl == null || fileUrl.isBlank()) {
            throw new RuntimeException("key is required");
        }

        UpdateTeamRequestDTO request =
                new UpdateTeamRequestDTO();

        request.setLogo_Url(fileUrl);

        teamService.updateTeam(authentication, request);

        return ResponseEntity.ok("Saved");
    }
}
