package com.botleague.backend.role.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.role.entity.UserRole;
import com.botleague.backend.role.repository.UserRoleRepository;

@Service
@Transactional
public class UserRoleService {

    private final UserRoleRepository userRoleRepository;

    public UserRoleService(UserRoleRepository userRoleRepository) {
        this.userRoleRepository = userRoleRepository;
    }

    // ── Generic role assignment (idempotent) ──────────────────────────────
    public void assignRole(UUID userId, AccountType roleType) {
        if (userRoleRepository.existsByUserIdAndRoleType(userId, roleType)) {
            return;
        }
        UserRole role = new UserRole();
        role.setUserId(userId);
        role.setRoleType(roleType);
        role.setStatus("APPROVED");
        userRoleRepository.save(role);
    }

    // ── Convenience shortcuts ─────────────────────────────────────────────
    public void ensureUserRole(UUID userId) {
        assignRole(userId, AccountType.COMPETITOR);
    }

    public void ensureOrganiserRole(UUID userId) {
        assignRole(userId, AccountType.ORGANIZER);
    }

    public void ensureAdminRole(UUID userId) {
        assignRole(userId, AccountType.ADMINISTRATOR);
    }

    // ── Role check ────────────────────────────────────────────────────────
    public boolean hasRole(UUID userId, AccountType roleType) {
        return userRoleRepository.existsByUserIdAndRoleType(userId, roleType);
    }
}
