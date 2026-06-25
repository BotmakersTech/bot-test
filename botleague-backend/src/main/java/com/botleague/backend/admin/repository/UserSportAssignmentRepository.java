package com.botleague.backend.admin.repository;

import com.botleague.backend.admin.entity.UserSportAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSportAssignmentRepository extends JpaRepository<UserSportAssignment, UUID> {

    List<UserSportAssignment> findByUserId(UUID userId);

    List<UserSportAssignment> findByEventId(UUID eventId);

    List<UserSportAssignment> findByEventSportId(UUID eventSportId);

    Optional<UserSportAssignment> findByUserIdAndEventSportId(UUID userId, UUID eventSportId);

    boolean existsByUserIdAndEventSportId(UUID userId, UUID eventSportId);

    void deleteByUserIdAndEventSportId(UUID userId, UUID eventSportId);
}
