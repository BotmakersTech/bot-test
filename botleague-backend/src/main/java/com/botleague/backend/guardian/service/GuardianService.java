package com.botleague.backend.guardian.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.service.OtpService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.guardian.dto.GuardianRequest;
import com.botleague.backend.guardian.dto.GuardianResponse;
import com.botleague.backend.guardian.entity.Guardian;
import com.botleague.backend.guardian.enums.GuardianVerificationStatus;
import com.botleague.backend.guardian.repository.GuardianRepository;

@Service
@Transactional
public class GuardianService {

    private final GuardianRepository guardianRepository;
    private final OtpService otpService;

    public GuardianService(GuardianRepository guardianRepository, OtpService otpService) {
        this.guardianRepository = guardianRepository;
        this.otpService = otpService;
    }

    /**
     * Creating or editing a guardian record always resets it to PENDING and
     * sends a fresh OTP to the guardian's own phone — consent must be
     * reconfirmed by the guardian, not just re-attested by the registrant,
     * every time the details on file change.
     */
    public GuardianResponse saveOrUpdate(UUID userId, GuardianRequest request) {
        Guardian guardian = guardianRepository.findByUserId(userId)
                .orElseGet(Guardian::new);

        guardian.setUserId(userId);
        guardian.setGuardianName(request.getGuardianName().trim());
        guardian.setRelationship(request.getRelationship().trim());
        guardian.setMobileNumber(request.getMobileNumber().trim());
        guardian.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        guardian.setEmergencyContact(request.getEmergencyContact().trim());
        guardian.setStatus(GuardianVerificationStatus.PENDING);
        guardian.setVerifiedAt(null);

        Guardian saved = guardianRepository.save(guardian);

        // sendOtp never throws (see OtpService) — a delivery failure doesn't
        // block saving the record; the registrant can resubmit to retry.
        otpService.sendOtp(saved.getMobileNumber());

        return toResponse(saved);
    }

    /**
     * Confirms the guardian's own OTP, sent to their own phone by saveOrUpdate.
     * Throws (via OtpService.verifyOtp) on a wrong/expired code.
     */
    public GuardianResponse confirmOtp(UUID userId, String otp) {
        Guardian guardian = guardianRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("No guardian profile on file"));

        otpService.verifyOtp(guardian.getMobileNumber(), otp);

        guardian.setStatus(GuardianVerificationStatus.CONFIRMED);
        guardian.setVerifiedAt(LocalDateTime.now());

        return toResponse(guardianRepository.save(guardian));
    }

    @Transactional(readOnly = true)
    public Optional<GuardianResponse> findByUserId(UUID userId) {
        return guardianRepository.findByUserId(userId).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public boolean hasGuardian(UUID userId) {
        return guardianRepository.existsByUserId(userId);
    }

    /** The correct check for anything gating registration/eligibility — a
     * PENDING guardian record has not actually been confirmed by the guardian. */
    @Transactional(readOnly = true)
    public boolean isGuardianConfirmed(UUID userId) {
        return guardianRepository.existsByUserIdAndStatus(userId, GuardianVerificationStatus.CONFIRMED);
    }

    private GuardianResponse toResponse(Guardian g) {
        GuardianResponse r = new GuardianResponse();
        r.setId(g.getId());
        r.setUserId(g.getUserId());
        r.setGuardianName(g.getGuardianName());
        r.setRelationship(g.getRelationship());
        r.setMobileNumber(g.getMobileNumber());
        r.setEmail(g.getEmail());
        r.setEmergencyContact(g.getEmergencyContact());
        r.setStatus(g.getStatus());
        r.setVerifiedAt(g.getVerifiedAt());
        r.setCreatedAt(g.getCreatedAt());
        r.setUpdatedAt(g.getUpdatedAt());
        return r;
    }
}
