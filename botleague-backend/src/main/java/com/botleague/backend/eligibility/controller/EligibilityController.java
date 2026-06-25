package com.botleague.backend.eligibility.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.security.SecurityUtils;
import com.botleague.backend.common.utils.EligibilityUtils;
import com.botleague.backend.eligibility.dto.EligibilityResponse;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.guardian.repository.GuardianRepository;

@RestController
@RequestMapping("/api/eligibility")
public class EligibilityController {

    private final UserRepository    userRepository;
    private final GuardianRepository guardianRepository;

    public EligibilityController(
            UserRepository userRepository,
            GuardianRepository guardianRepository
    ) {
        this.userRepository    = userRepository;
        this.guardianRepository = guardianRepository;
    }

    /**
     * GET /api/eligibility/me
     * Returns the calling user's age category, guardian status, and
     * whether they are currently allowed to register for events.
     */
    @GetMapping("/me")
    public ResponseEntity<EligibilityResponse> getMyEligibility(Authentication auth) {
        UUID userId = SecurityUtils.currentUserId(auth);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> com.botleague.backend.common.exception.ApiException
                        .notFound("User not found"));

        if (user.getDateOfBirth() == null) {
            return ResponseEntity.ok(EligibilityResponse.noDob());
        }

        int age              = EligibilityUtils.calculateAge(user.getDateOfBirth());
        AgeCategory category = EligibilityUtils.getCategoryForAge(age);
        boolean reqGuardian  = EligibilityUtils.requiresGuardian(user.getDateOfBirth());
        boolean hasGuardian  = guardianRepository.existsByUserId(userId);

        EligibilityResponse r = new EligibilityResponse();
        r.setAge(age);

        if (category != null) {
            r.setCategory(category.name());
            r.setCategoryLabel(EligibilityUtils.toCategoryLabel(category));
            r.setAgeRange(EligibilityUtils.toCategoryAgeRange(category));
            r.setEligible(true);
        } else {
            r.setEligible(false);
        }

        r.setRequiresGuardian(reqGuardian);
        r.setHasGuardian(hasGuardian);

        boolean canRegister = r.isEligible() && (!reqGuardian || hasGuardian);
        r.setCanRegister(canRegister);

        if (!r.isEligible()) {
            r.setBlockReason(age < EligibilityUtils.JUNIOR_MIN
                    ? "Minimum age for competition is " + EligibilityUtils.JUNIOR_MIN + " years."
                    : "Age not within a valid competition category.");
        } else if (reqGuardian && !hasGuardian) {
            r.setBlockReason("Participants under 18 must add a guardian profile before registering.");
        }

        return ResponseEntity.ok(r);
    }
}
