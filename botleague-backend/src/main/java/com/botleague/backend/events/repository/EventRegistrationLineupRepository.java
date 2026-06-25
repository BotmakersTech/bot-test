package com.botleague.backend.events.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.botleague.backend.events.entity.EventRegistrationLineup;

@Repository
public interface EventRegistrationLineupRepository
        extends JpaRepository<EventRegistrationLineup, UUID> {

    // ----------------------------------------------------------
    // USED BY: addMember() – duplicate check
    //   One TeamMembership can hold only ONE role per robot per competition.
    // ----------------------------------------------------------
    boolean existsBySportRegistrationIdAndRobotIdAndTeamMembershipIdAndIsActive(
            UUID sportRegistrationId,
            UUID robotId,
            UUID teamMembershipId,
            Boolean isActive
    );

    // ----------------------------------------------------------
    // USED BY: addMember() – roster size cap
    //   Counts active people already in a robot's lineup.
    // ----------------------------------------------------------
    long countBySportRegistrationIdAndIsActive(
            UUID sportRegistrationId,
            Boolean isActive
    );

    // ----------------------------------------------------------
    // USED BY: getLineupForRegistration()
    //   All active members for one robot registration.
    // ----------------------------------------------------------
    List<EventRegistrationLineup> findBySportRegistrationIdAndIsActive(
            UUID sportRegistrationId,
            Boolean isActive
    );

    // ----------------------------------------------------------
    // USED BY: getLineupForRobot()
    //   All active assignments for a robot across all competitions.
    // ----------------------------------------------------------
    List<EventRegistrationLineup> findByRobotIdAndIsActive(
            UUID robotId,
            Boolean isActive
    );

    // ----------------------------------------------------------
    // USED BY: getLineupForRobotInSport()
    //   Active members for one robot in one specific competition.
    // ----------------------------------------------------------
    List<EventRegistrationLineup> findBySportRegistrationIdAndRobotIdAndIsActive(
            UUID sportRegistrationId,
            UUID robotId,
            Boolean isActive
    );

    // ----------------------------------------------------------
    // USED BY: getLineupForMember()
    //   All competitions a TeamMembership holder is assigned to.
    // ----------------------------------------------------------
    List<EventRegistrationLineup> findByTeamMembershipIdAndIsActive(
            UUID teamMembershipId,
            Boolean isActive
    );

    // ----------------------------------------------------------
    // USED BY: getTeamLineupInSport()
    //   All active assignments for a team in one competition.
    // ----------------------------------------------------------
    List<EventRegistrationLineup> findByEventSportIdAndTeamIdAndIsActive(
            UUID eventSportId,
            UUID teamId,
            Boolean isActive
    );

    // ----------------------------------------------------------
    // USED BY: getFullEventRoster()
    //   All active assignments across a whole event.
    // ----------------------------------------------------------
    List<EventRegistrationLineup> findByEventIdAndIsActive(
            UUID eventId,
            Boolean isActive
    );

    // ----------------------------------------------------------
    // USED BY: updateRole() / direct lookup
    //   Fetch exact lineup row for a robot + membership combination.
    // ----------------------------------------------------------
    Optional<EventRegistrationLineup> findBySportRegistrationIdAndRobotIdAndTeamMembershipId(
            UUID sportRegistrationId,
            UUID robotId,
            UUID teamMembershipId
    );

    // ----------------------------------------------------------
    // USED BY: cross-sport overload check (optional)
    //   How many active lineup entries does a membership hold in one event?
    // ----------------------------------------------------------
    long countByEventIdAndTeamMembershipIdAndIsActive(
            UUID eventId,
            UUID teamMembershipId,
            Boolean isActive
    );
}