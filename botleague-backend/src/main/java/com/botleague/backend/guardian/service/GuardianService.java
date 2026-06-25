package com.botleague.backend.guardian.service;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.guardian.dto.GuardianRequest;
import com.botleague.backend.guardian.dto.GuardianResponse;
import com.botleague.backend.guardian.entity.Guardian;
import com.botleague.backend.guardian.repository.GuardianRepository;

@Service
@Transactional
public class GuardianService {

    private final GuardianRepository guardianRepository;

    public GuardianService(GuardianRepository guardianRepository) {
        this.guardianRepository = guardianRepository;
    }

    public GuardianResponse saveOrUpdate(UUID userId, GuardianRequest request) {
        Guardian guardian = guardianRepository.findByUserId(userId)
                .orElseGet(Guardian::new);

        guardian.setUserId(userId);
        guardian.setGuardianName(request.getGuardianName().trim());
        guardian.setRelationship(request.getRelationship().trim());
        guardian.setMobileNumber(request.getMobileNumber().trim());
        guardian.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        guardian.setEmergencyContact(request.getEmergencyContact().trim());

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

    private GuardianResponse toResponse(Guardian g) {
        GuardianResponse r = new GuardianResponse();
        r.setId(g.getId());
        r.setUserId(g.getUserId());
        r.setGuardianName(g.getGuardianName());
        r.setRelationship(g.getRelationship());
        r.setMobileNumber(g.getMobileNumber());
        r.setEmail(g.getEmail());
        r.setEmergencyContact(g.getEmergencyContact());
        r.setCreatedAt(g.getCreatedAt());
        r.setUpdatedAt(g.getUpdatedAt());
        return r;
    }
}
