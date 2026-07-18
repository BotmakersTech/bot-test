package com.botleague.backend.team.controller;

import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.profile.dto.UploadResponse;
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
    private final PublicTeamService publicTeamService;

    public TeamController(TeamService teamService, PublicTeamService publicTeamService) {
        this.teamService       = teamService;
        this.publicTeamService = publicTeamService;
    }

    /** Public team profile by UUID — no authentication required. */
    @GetMapping("/public/{teamId}")
    public ResponseEntity<PublicTeamProfileDTO> getPublicProfile(@PathVariable UUID teamId) {
        return ResponseEntity.ok(publicTeamService.getPublicProfile(teamId));
    }

    /** Public team profile by team code (e.g. BLT0000001) — no authentication required. */
    @GetMapping("/public/code/{teamCode}")
    public ResponseEntity<PublicTeamProfileDTO> getPublicProfileByCode(@PathVariable String teamCode) {
        return ResponseEntity.ok(publicTeamService.getPublicProfileByCode(teamCode));
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
            @Valid @RequestBody UpdateTeamRequestDTO request) {

        return ResponseEntity.ok(teamService.updateTeam(authentication, request));
    }
    

    @GetMapping("/{teamId}/members")
    public ResponseEntity<GetTeamMembersDTO> getTeamMembers(
            Authentication authentication,
            @PathVariable String teamId) {

        GetTeamMembersDTO response = teamService.getTeamMembers(authentication, teamId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload/{teamId}/logo")
    public ResponseEntity<UploadResponse> getTeamLogoUploadUrl(

            @PathVariable UUID teamId,

            Authentication authentication,

            @RequestParam String fileType,

            @RequestParam long fileSize
    ) {

        UploadResponse response =
                teamService.generateLogoUploadUrl(authentication, teamId, fileType, fileSize);

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
            throw ApiException.badRequest("key is required");
        }

        UpdateTeamRequestDTO request =
                new UpdateTeamRequestDTO();

        request.setLogo_Url(fileUrl);

        teamService.updateTeam(authentication, request);

        return ResponseEntity.ok("Saved");
    }
}
