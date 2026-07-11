package com.botleague.backend.admin.repository;

import com.botleague.backend.admin.entity.ResourceRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResourceRoleAssignmentRepository extends JpaRepository<ResourceRoleAssignment, UUID> {

    List<ResourceRoleAssignment> findByUserId(UUID userId);

    List<ResourceRoleAssignment> findByUserIdAndStatus(UUID userId, String status);

    List<ResourceRoleAssignment> findByEventId(UUID eventId);

    List<ResourceRoleAssignment> findByScopeTypeAndScopeId(String scopeType, UUID scopeId);

    List<ResourceRoleAssignment> findByEventIdAndScopeType(UUID eventId, String scopeType);

    Optional<ResourceRoleAssignment> findByUserIdAndScopeTypeAndScopeId(UUID userId, String scopeType, UUID scopeId);

    boolean existsByUserIdAndScopeTypeAndScopeIdAndStatus(UUID userId, String scopeType, UUID scopeId, String status);

    void deleteByUserIdAndScopeTypeAndScopeId(UUID userId, String scopeType, UUID scopeId);

    long countByUserIdAndRoleTypeAndStatus(UUID userId, String roleType, String status);
}
