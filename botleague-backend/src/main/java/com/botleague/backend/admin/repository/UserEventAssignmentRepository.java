package com.botleague.backend.admin.repository;

import com.botleague.backend.admin.entity.UserEventAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserEventAssignmentRepository extends JpaRepository<UserEventAssignment, UUID> {

    List<UserEventAssignment> findByUserId(UUID userId);

    List<UserEventAssignment> findByEventId(UUID eventId);

    Optional<UserEventAssignment> findByUserIdAndEventId(UUID userId, UUID eventId);

    boolean existsByUserIdAndEventId(UUID userId, UUID eventId);

    void deleteByUserIdAndEventId(UUID userId, UUID eventId);
}
