package com.botleague.backend.guardian.controller;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.common.security.SecurityUtils;
import com.botleague.backend.guardian.dto.GuardianOtpVerifyRequest;
import com.botleague.backend.guardian.dto.GuardianRequest;
import com.botleague.backend.guardian.dto.GuardianResponse;
import com.botleague.backend.guardian.service.GuardianService;

@RestController
@RequestMapping("/api/guardian")
public class GuardianController {

    private final GuardianService guardianService;

    public GuardianController(GuardianService guardianService) {
        this.guardianService = guardianService;
    }

    /** GET /api/guardian — fetch the caller's guardian profile (404 if none). */
    @GetMapping
    public ResponseEntity<GuardianResponse> getMyGuardian(Authentication auth) {
        UUID userId = SecurityUtils.currentUserId(auth);
        return guardianService.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/guardian — create or update the caller's guardian profile.
     * Always resets verification to PENDING and sends a fresh OTP to the
     * guardian's own phone; the eligibility gate only opens once that OTP
     * is confirmed via POST /api/guardian/verify-otp.
     */
    @PostMapping
    public ResponseEntity<GuardianResponse> saveGuardian(
            @Valid @RequestBody GuardianRequest request,
            Authentication auth
    ) {
        UUID userId = SecurityUtils.currentUserId(auth);
        return ResponseEntity.ok(guardianService.saveOrUpdate(userId, request));
    }

    /** POST /api/guardian/verify-otp — confirm the OTP sent to the guardian's phone. */
    @PostMapping("/verify-otp")
    public ResponseEntity<GuardianResponse> verifyOtp(
            @Valid @RequestBody GuardianOtpVerifyRequest request,
            Authentication auth
    ) {
        UUID userId = SecurityUtils.currentUserId(auth);
        return ResponseEntity.ok(guardianService.confirmOtp(userId, request.getOtp()));
    }
}
