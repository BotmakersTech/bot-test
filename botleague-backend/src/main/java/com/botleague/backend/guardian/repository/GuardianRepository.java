package com.botleague.backend.guardian.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.botleague.backend.guardian.entity.Guardian;

public interface GuardianRepository extends JpaRepository<Guardian, UUID> {
    Optional<Guardian> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
}
