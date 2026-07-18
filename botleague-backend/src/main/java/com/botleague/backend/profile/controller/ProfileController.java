package com.botleague.backend.profile.controller;

import java.util.Map;
import java.util.UUID;

import org.apache.coyote.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.profile.dto.ProfileResponseDTO;
import com.botleague.backend.profile.dto.PublicProfileResponseDTO;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.profile.dto.ChangePhoneRequestDTO;
import com.botleague.backend.profile.dto.UpdateEmailRequestDTO;
import com.botleague.backend.profile.dto.UpdateProfileRequestDTO;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.dto.UsernameRequest;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;
import com.botleague.backend.profile.service.PublicProfileService;

import com.botleague.backend.profile.service.UserProfileService;

import jakarta.validation.Valid;

import com.botleague.backend.profile.service.FileKeyService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserProfileService    userProfileService;
    private final UploadService         uploadService;
    private final PublicProfileService  publicProfileService;
    private final FileKeyService        fileKeyService;
    private final UserRepository        userRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final TeamRepository        teamRepository;
    private final com.botleague.backend.common.service.GetFileService getFileService;

    public ProfileController(UserProfileService userProfileService,
                             UploadService uploadService,
                             PublicProfileService publicProfileService,
                             FileKeyService fileKeyService,
                             UserRepository userRepository,
                             TeamMembershipRepository teamMembershipRepository,
                             TeamRepository teamRepository,
                             com.botleague.backend.common.service.GetFileService getFileService) {
        this.userProfileService       = userProfileService;
        this.uploadService            = uploadService;
        this.publicProfileService     = publicProfileService;
        this.fileKeyService           = fileKeyService;
        this.userRepository           = userRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.teamRepository           = teamRepository;
        this.getFileService           = getFileService;
    }

    // =========================
    // Get current user profile
    // =========================
    @GetMapping("/me")
    public ProfileResponseDTO getMyProfile(Authentication authentication) {

        return userProfileService.getMyProfile(authentication);
    }
    
//    @PostMapping("/photo")
//    public ResponseEntity<String> uploadProfilePhoto(
//            Authentication auth,
//            @RequestParam("file") MultipartFile file) {
//
//        String url = userProfileService.updateProfilePhoto(auth, file);
//        return ResponseEntity.ok(url);
//    }

    // =========================
    // Update profile
    // =========================
    @PatchMapping("/me")
    public ProfileResponseDTO updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequestDTO request) {

        return userProfileService.updateProfile(authentication, request);
    }
    
    @PostMapping("/update-email")
    public ResponseEntity<String> updateEmail(
            Authentication authentication,
            @Valid @RequestBody
            UpdateEmailRequestDTO request
    ) {

        String response =
                userProfileService.updateEmail(
                        authentication,
                        request.getEmail()
                );

        return ResponseEntity.ok(response);
    }

    // =========================================
    // VERIFY EMAIL
    // =========================================

    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(
            @RequestParam String token
    ) {

        String response =
                userProfileService.verifyEmail(token);

        return ResponseEntity.ok(response);
    }


    // =========================
    // Generate Upload URL (PROFILE)
    // =========================
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> getProfileUploadUrl(
            Authentication authentication,
            @RequestParam String fileType,
            @RequestParam long fileSize
    ) {

        String userId = (String) authentication.getPrincipal();

        // Generate key
        String key = fileKeyService.generateProfileKey(userId, fileType);

        // Generate presigned URL
        UploadResponse response =
                uploadService.generateUploadUrl(key, fileType, fileSize);

        return ResponseEntity.ok(response);
    }

    // =========================
    // Change phone (OTP-verified)
    // =========================
    @PostMapping("/change-phone")
    public ResponseEntity<String> changePhone(
            Authentication authentication,
            @Valid @RequestBody ChangePhoneRequestDTO request) {
        userProfileService.changePhone(authentication, request);
        return ResponseEntity.ok("Phone number updated successfully");
    }

    // =========================
    // Public profile by UUID (existing)
    // =========================
    @GetMapping("/{userId}")
    public PublicProfileResponseDTO getProfile(@PathVariable UUID userId) {
        return publicProfileService.publicProfileView(userId);
    }

    // =========================
    // Public profile by BotLeague ID — no auth required
    // e.g. GET /api/profile/public/BLU0000001
    // =========================
    @GetMapping("/public/{botleagueId}")
    public ResponseEntity<Map<String, Object>> getPublicProfileByCode(
            @PathVariable String botleagueId) {

        User user = userRepository.findByBotleagueId(botleagueId)
                .orElseThrow(() -> com.botleague.backend.common.exception.ApiException.notFound("User not found"));

        Map<String, Object> profile = new java.util.LinkedHashMap<>();
        profile.put("userId",        user.getId());
        profile.put("botleagueId",   user.getBotleagueId());
        profile.put("firstName",     user.getFirstName());
        profile.put("lastName",      user.getLastName());
        profile.put("username",      user.getUsername());
        profile.put("profilePhotoUrl", getFileService.resolveProfileImage(user.getProfilePhotoUrl()));
        profile.put("city",          user.getCity());
        profile.put("state",         user.getState());
        profile.put("country",       user.getCountry());
        profile.put("memberSince",   user.getCreatedAt());
        profile.put("accountType",   user.getAccountType() != null ? user.getAccountType().name() : null);

        // Active team info
        teamMembershipRepository
                .findByUserIdAndStatus(user.getId(), TeamMembershipStatus.ACTIVE)
                .ifPresent(m -> {
                    profile.put("teamRole", m.getRoleInTeam() != null ? m.getRoleInTeam().name() : null);
                    teamRepository.findById(m.getTeamId()).ifPresent(t -> {
                        profile.put("teamId",     t.getId());
                        profile.put("teamCode",   t.getTeamCode());
                        profile.put("teamName",   t.getTeamName());
                        profile.put("teamLogo",   t.getLogoUrl());
                    });
                });

        return ResponseEntity.ok(profile);
    }
    
    @PostMapping("/photo")
    public ResponseEntity<String> saveProfilePhoto(
            Authentication authentication,
            @RequestBody Map<String, String> body) {

        String fileUrl = body.get("fileUrl");

        if (fileUrl == null || fileUrl.isEmpty()) {
            throw ApiException.badRequest("fileUrl is required");
        }

        userProfileService.updateProfilePhoto(authentication, fileUrl);

        return ResponseEntity.ok("Saved");
    }
    @PostMapping("/addUserName")
    public ResponseEntity<String> addUserName(
            Authentication authentication,
            @Valid @RequestBody UsernameRequest request
    ) throws BadRequestException {

        String username = userProfileService.addUsername(
        		authentication,
                request.getUsername()
        );

        return ResponseEntity.ok(username);
    }
    
}