package com.botleague.backend.events.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.utils.EligibilityUtils;
import com.botleague.backend.events.entity.EventRegistrationLineup;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.events.enums.LineupRole;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.repository.EventRegistrationLineupRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.team.entity.Robot;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.RobotStatus;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.RobotRepository;
import com.botleague.backend.team.repository.TeamMembershipRepository;

/**
 * Manages the lineup of team members (people) for each robot registration.
 *
 * Core binding: each lineup row ties ONE TeamMembership (person on a team)
 * to ONE Robot inside ONE competition (SportRegistration).
 *
 *   SportRegistration (robot in competition)
 *        │
 *        ├── robotId            ← which physical robot
 *        └── EventRegistrationLineup[]
 *               ├── robotId + teamMembershipId  ← person ↔ robot binding
 *               └── lineupRole                  ← OPERATOR / CO_OPERATOR / TECHNICIAN ...
 *
 * Validation pipeline for addMember():
 *  1. SportRegistration must exist and NOT be CANCELLED
 *  2. EventSports must exist  (for roster size limits)
 *  3. Robot must exist, be ACTIVE, and match the registration's robotId
 *  4. TeamMembership must exist, be ACTIVE, and belong to the same team
 *  5. Duplicate check: same membership cannot be in the same robot's lineup twice
 *  6. Roster cap: active lineup count < EventSports.maxTeamSize
 *  7. Role must be valid for the competition type (robot vs project)
 */
@Service
@Transactional
public class SportRegistrationLineupService {

    // =====================================================
    // DEPENDENCIES
    // =====================================================

    private final EventRegistrationLineupRepository lineupRepository;
    private final SportRegistrationRepository       sportRegistrationRepository;
    private final EventSportsRepository             eventSportsRepository;
    private final RobotRepository                   robotRepository;
    private final TeamMembershipRepository          teamMembershipRepository;
    private final UserRepository                    userRepository;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public SportRegistrationLineupService(
            EventRegistrationLineupRepository lineupRepository,
            SportRegistrationRepository       sportRegistrationRepository,
            EventSportsRepository             eventSportsRepository,
            RobotRepository                   robotRepository,
            TeamMembershipRepository          teamMembershipRepository,
            UserRepository                    userRepository
    ) {
        this.lineupRepository            = lineupRepository;
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.eventSportsRepository       = eventSportsRepository;
        this.robotRepository             = robotRepository;
        this.teamMembershipRepository    = teamMembershipRepository;
        this.userRepository              = userRepository;
    }

    // =====================================================
    // ADD MEMBER TO ROBOT LINEUP
    // =====================================================

    /**
     * Assigns a team membership (person) to a robot in a competition lineup.
     *
     * @param sportRegistrationId  SportRegistration.id   (robot's competition entry)
     * @param robotId              Robot.id               (must match the registration)
     * @param teamMembershipId     TeamMembership.id      (person to assign)
     * @param role                 their role             (OPERATOR / CO_OPERATOR / ...)
     * @return                     the saved lineup row
     */
    public EventRegistrationLineup addMember(
            UUID sportRegistrationId,
            UUID robotId,
            UUID teamMembershipId,
            LineupRole role
    ) {

        // =================================================
        // 1. FIND SPORT REGISTRATION
        //    Must exist and must not be CANCELLED.
        // =================================================

        SportRegistration registration = sportRegistrationRepository
                .findById(sportRegistrationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Sport registration not found: " + sportRegistrationId));

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new IllegalStateException(
                    "Cannot add members to a cancelled registration.");
        }

        // =================================================
        // 2. FIND EVENT SPORTS (for roster cap)
        // =================================================

        EventSports eventSport = eventSportsRepository
                .findById(registration.getEventSportId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Event sport not found: " + registration.getEventSportId()));

        // =================================================
        // 3. VALIDATE ROBOT
        //    a) Must exist and be ACTIVE (not retired/deleted).
        //    b) robotId must match the one on the registration —
        //       cannot assign a person to a robot different from
        //       the one entered under this SportRegistration.
        //    c) Robot must belong to the same team as the registration.
        // =================================================

        Robot robot = robotRepository
                .findById(robotId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Robot not found: " + robotId));

        if (robot.getStatus() != RobotStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Robot '" + robot.getRobotName() + "' is not active " +
                    "(status: " + robot.getStatus() + ").");
        }

        if (!robotId.equals(registration.getRobotId())) {
            throw new IllegalArgumentException(
                    "Robot mismatch: provided robot (" + robotId + ") " +
                    "does not match the robot on this registration (" +
                    registration.getRobotId() + "). " +
                    "Lineup entries must be bound to the registered robot.");
        }

        if (!robot.getTeamId().equals(registration.getTeamId())) {
            throw new IllegalArgumentException(
                    "Robot '" + robot.getRobotName() + "' does not belong to " +
                    "the team that owns this registration.");
        }

        // =================================================
        // 4. FIND TEAM MEMBERSHIP + VALIDATE
        //    a) TeamMembership must exist.
        //    b) Membership must be ACTIVE (not PENDING / INACTIVE / REMOVED).
        //    c) Membership must belong to the same team as the registration.
        // =================================================

        TeamMembership membership = teamMembershipRepository
                .findById(teamMembershipId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Team membership not found: " + teamMembershipId));

        if (membership.getStatus() != TeamMembershipStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Team membership is not active " +
                    "(status: " + membership.getStatus() + "). " +
                    "Only ACTIVE members can be added to a lineup.");
        }

        if (!membership.getTeamId().equals(registration.getTeamId())) {
            throw new IllegalArgumentException(
                    "Team membership does not belong to the team that owns this registration. " +
                    "Registration team: " + registration.getTeamId() +
                    ", Membership team: " + membership.getTeamId());
        }

        // =================================================
        // 4.5 AGE CATEGORY CHECK FOR LINEUP MEMBER
        //     Same rule as captain registration: member's DOB must fall
        //     in the sport's ageGroup (if the sport has one set).
        // =================================================

        if (eventSport.getAgeGroup() != null) {
            User member = userRepository.findById(membership.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "User account not found for this team member."));

            if (member.getDateOfBirth() == null) {
                throw new IllegalStateException(
                        "Team member does not have a date of birth on file. " +
                        "All lineup members must complete their profile (date of birth) before being added.");
            }

            int memberAge = EligibilityUtils.calculateAge(member.getDateOfBirth());
            AgeCategory memberCategory = EligibilityUtils.getCategoryForAge(memberAge);

            if (memberCategory == null) {
                throw new IllegalStateException(
                        "Team member is not eligible for competition (age " + memberAge + "). " +
                        "Minimum age is " + EligibilityUtils.JUNIOR_MIN + " years.");
            }

            if (!eventSport.getAgeGroup().equals(memberCategory)) {
                throw new IllegalStateException(
                        "Age category mismatch: this sport is for "
                        + EligibilityUtils.toCategoryLabel(eventSport.getAgeGroup())
                        + " (" + EligibilityUtils.toCategoryAgeRange(eventSport.getAgeGroup()) + "), "
                        + "but this team member is in "
                        + EligibilityUtils.toCategoryLabel(memberCategory)
                        + " (age " + memberAge + "). "
                        + "Only members in the correct age category can be added to this lineup.");
            }
        }

        // =================================================
        // 5. DUPLICATE CHECK
        //    A person can only hold ONE role per robot per competition.
        //    They CAN be assigned to a different robot in another competition.
        // =================================================

        boolean alreadyAssigned = lineupRepository
                .existsBySportRegistrationIdAndRobotIdAndTeamMembershipIdAndIsActive(
                        sportRegistrationId, robotId, teamMembershipId, true);

        if (alreadyAssigned) {
            throw new IllegalStateException(
                    "This team member is already assigned to robot '" +
                    robot.getRobotName() + "' in this competition.");
        }

        // =================================================
        // 6. ROSTER SIZE CAP
        //    EventSports.maxTeamSize = max people allowed per robot lineup.
        //    e.g. Junior Innovators: maxTeamSize = 5
        // =================================================

        long currentSize = lineupRepository
                .countBySportRegistrationIdAndIsActive(sportRegistrationId, true);

        if (currentSize >= eventSport.getMaxTeamSize()) {
            throw new IllegalStateException(
                    "Lineup for robot '" + robot.getRobotName() + "' is full. " +
                    "Maximum allowed: " + eventSport.getMaxTeamSize());
        }

        // =================================================
        // 7. ROLE VALIDATION
        //    Robot-based sports  → OPERATOR, CO_OPERATOR, TECHNICIAN
        //    Project-based sports → PRESENTER, BUILDER
        // =================================================

        validateRoleForCompetition(role, eventSport);

        // =================================================
        // 8. BUILD LINEUP ENTRY
        //    robotId stored directly — explicit person ↔ robot binding.
        //    Denorm fields (eventId, eventSportId, teamId) from the
        //    registration for fast lookups without joins.
        // =================================================

        EventRegistrationLineup lineup = new EventRegistrationLineup();

        lineup.setSportRegistrationId(sportRegistrationId);
        lineup.setRobotId(robotId);                         // direct robot binding
        lineup.setTeamMembershipId(teamMembershipId);       // TeamMembership, not TeamMember

        // Denorm from registration
        lineup.setEventId(registration.getEventId());
        lineup.setEventSportId(registration.getEventSportId());
        lineup.setTeamId(registration.getTeamId());

        lineup.setLineupRole(role);
        lineup.setIsActive(true);

        return lineupRepository.save(lineup);
    }

    // =====================================================
    // REMOVE MEMBER (soft-delete)
    // =====================================================

    /**
     * Deactivates a lineup entry. Row is kept for audit history.
     * Frees the slot so a replacement can be added.
     */
    public void removeMember(UUID lineupId) {

        EventRegistrationLineup lineup = lineupRepository
                .findById(lineupId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Lineup entry not found: " + lineupId));

        if (!Boolean.TRUE.equals(lineup.getIsActive())) {
            throw new IllegalStateException("Lineup entry is already inactive.");
        }

        lineup.setIsActive(false);
        lineupRepository.save(lineup);
    }

    // =====================================================
    // UPDATE ROLE
    // =====================================================

    /**
     * Changes a member's role for the robot they are already assigned to.
     * e.g. promote CO_OPERATOR → OPERATOR, or switch TECHNICIAN → CO_OPERATOR.
     */
    public EventRegistrationLineup updateRole(UUID lineupId, LineupRole newRole) {

        EventRegistrationLineup lineup = lineupRepository
                .findById(lineupId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Lineup entry not found: " + lineupId));

        if (!Boolean.TRUE.equals(lineup.getIsActive())) {
            throw new IllegalStateException(
                    "Cannot update role on an inactive lineup entry. Re-add the member first.");
        }

        EventSports eventSport = eventSportsRepository
                .findById(lineup.getEventSportId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Event sport not found: " + lineup.getEventSportId()));

        validateRoleForCompetition(newRole, eventSport);

        lineup.setLineupRole(newRole);
        return lineupRepository.save(lineup);
    }

    // =====================================================
    // QUERIES
    // =====================================================

    /**
     * Returns a single lineup entry by its ID, throwing 404 if not found.
     * Used by mutation endpoints that need to resolve teamId for auth before acting.
     */
    public EventRegistrationLineup getLineupById(UUID lineupId) {
        return lineupRepository
                .findById(lineupId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Lineup entry not found: " + lineupId));
    }

    /**
     * All active members in one robot registration's lineup.
     * "Who is assigned to Robot X in Competition Y?"
     */
    public List<EventRegistrationLineup> getLineupForRegistration(
            UUID sportRegistrationId
    ) {
        return lineupRepository
                .findBySportRegistrationIdAndIsActive(sportRegistrationId, true);
    }

    /**
     * All active lineup entries for a specific robot across all competitions.
     * "Who has ever been assigned to Robot X?"
     */
    public List<EventRegistrationLineup> getLineupForRobot(UUID robotId) {
        return lineupRepository.findByRobotIdAndIsActive(robotId, true);
    }

    /**
     * Active members for one robot in one specific competition.
     * "Who is operating Robot X in Competition Y?"
     */
    public List<EventRegistrationLineup> getLineupForRobotInSport(
            UUID sportRegistrationId,
            UUID robotId
    ) {
        return lineupRepository
                .findBySportRegistrationIdAndRobotIdAndIsActive(
                        sportRegistrationId, robotId, true);
    }

    /**
     * All competitions a team membership holder is actively assigned to.
     * "Which robots is Person X operating?"
     */
    public List<EventRegistrationLineup> getLineupForMember(UUID teamMembershipId) {
        return lineupRepository
                .findByTeamMembershipIdAndIsActive(teamMembershipId, true);
    }

    /**
     * All active assignments for a team in one competition.
     * Full sport roster for the team.
     */
    public List<EventRegistrationLineup> getTeamLineupInSport(
            UUID eventSportId,
            UUID teamId
    ) {
        return lineupRepository
                .findByEventSportIdAndTeamIdAndIsActive(eventSportId, teamId, true);
    }

    /**
     * All active assignments across an entire event.
     * Full event participant roster.
     */
    public List<EventRegistrationLineup> getFullEventRoster(UUID eventId) {
        return lineupRepository.findByEventIdAndIsActive(eventId, true);
    }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================

    /**
     * Validates that the role is appropriate for the competition type.
     *
     * Project-based (Junior Innovators – Project Based):
     *   → PRESENTER or BUILDER only
     *
     * All robot-based sports (everything else in BotLeague):
     *   → OPERATOR, CO_OPERATOR, TECHNICIAN only
     *   → PRESENTER / BUILDER are rejected
     */
    private void validateRoleForCompetition(LineupRole role, EventSports eventSport) {

        if (role == null) {
            throw new IllegalArgumentException("Lineup role must not be null.");
        }

        String sport = eventSport.getSport() == null
                ? ""
                : eventSport.getSport().toUpperCase();

        boolean isProjectBased = sport.contains("PROJECT");

        if (isProjectBased) {
            if (role != LineupRole.PRESENTER && role != LineupRole.BUILDER) {
                throw new IllegalArgumentException(
                        "Project-based competitions require PRESENTER or BUILDER, " +
                        "but got: " + role);
            }
        } else {
            if (role == LineupRole.PRESENTER || role == LineupRole.BUILDER) {
                throw new IllegalArgumentException(
                        "Role " + role + " is only valid for Project-based competitions.");
            }
        }
    }
}