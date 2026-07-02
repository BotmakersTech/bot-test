package com.botleague.backend.events.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.chat.service.ChatService;
import com.botleague.backend.common.utils.EligibilityUtils;
import com.botleague.backend.events.dto.EventRegistrationResponse;
import com.botleague.backend.events.dto.RegistrationRequest;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.enums.ControlMode;
import com.botleague.backend.events.enums.ControlType;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.realtime.service.RealtimePublisher;
import com.botleague.backend.guardian.repository.GuardianRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.team.entity.Robot;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.enums.RobotStatus;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.RobotRepository;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;

/**
 * Handles robot registration into event competitions (EventSports rows).
 *
 * ControlType enum exists in TWO packages:
 *   com.botleague.backend.team.enums.ControlType   – stored on Robot
 *   com.botleague.backend.events.enums.ControlType – stored on EventSports + SportRegistration
 *
 * Both enums share the same constant names (WIRED, WIRELESS, ANY).
 * The private helper mapControlType() converts between them so no
 * cross-package dependency leaks into either entity.
 */
@Service
@Transactional
public class SportRegistrationService {

    // =====================================================
    // DEPENDENCIES
    // =====================================================

    private final SportRegistrationRepository sportRegistrationRepository;
    private final EventSportsRepository        eventSportsRepository;
    private final EventRepository              eventRepository;
    private final TeamRepository               teamRepository;
    private final TeamMembershipRepository     teamMembershipRepository;
    private final RobotRepository              robotRepository;
    private final UserRepository               userRepository;
    private final GuardianRepository           guardianRepository;
    private final NotificationService          notificationService;
    private final AuditLogService              auditLogService;
    private final ChatService                  chatService;
    private final RealtimePublisher            realtimePublisher;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public SportRegistrationService(
            SportRegistrationRepository sportRegistrationRepository,
            EventSportsRepository       eventSportsRepository,
            EventRepository             eventRepository,
            TeamRepository              teamRepository,
            TeamMembershipRepository    teamMembershipRepository,
            RobotRepository             robotRepository,
            UserRepository              userRepository,
            GuardianRepository          guardianRepository,
            NotificationService         notificationService,
            AuditLogService             auditLogService,
            ChatService                 chatService,
            RealtimePublisher           realtimePublisher
    ) {
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.eventSportsRepository       = eventSportsRepository;
        this.eventRepository             = eventRepository;
        this.teamRepository              = teamRepository;
        this.teamMembershipRepository    = teamMembershipRepository;
        this.robotRepository             = robotRepository;
        this.userRepository              = userRepository;
        this.guardianRepository          = guardianRepository;
        this.notificationService         = notificationService;
        this.auditLogService             = auditLogService;
        this.chatService                 = chatService;
        this.realtimePublisher           = realtimePublisher;
    }

    // =====================================================
    // REGISTER ROBOT
    // =====================================================

    /**
     * Full validation pipeline before saving a registration:
     *
     *  1.  EventSports row must exist
     *  2.  Status must be REGISTRATION_OPEN
     *  3.  Date window must be active  (registrationStartDate <= today <= registrationEndDate)
     *  4.  Competition must not be full (registeredTeamsCount < maxTeams)
     *  5.  Team must exist
     *  6.  Robot must exist, be ACTIVE (not deleted/retired), and belong to the team
     *  7.  Duplicate check – same robot cannot hold an active registration in the same competition
     *  8.  maxBotsPerTeam – team must not exceed the per-team robot cap for this competition
     *      (Plug N Play Junior = 1 bot per team; most others = null = unlimited)
     *  9.  Physical spec validation via SportRegistration.validateAgainst(EventSports):
     *        weightKg  <= weightLimitKg
     *        lengthCm  <= maxLengthCm
     *        widthCm   <= maxWidthCm
     *        heightCm  <= maxHeightCm
     *        controlType must match (unless competition allows ANY / null)
     *
     *  Category reference (all stored as EventSports rows):
     *   ┌─────────────────────────────────────────────────────────────────────────┐
     *   │ JUNIOR INNOVATORS (8-12 yrs) – WIRED or WIRELESS, age group JUNIOR     │
     *   │  • Project Based            – no physical limits                        │
     *   │  • Plug N Play (Race+Soccer)– 1 kg, 20×20×20 cm, maxBotsPerTeam = 1    │
     *   │  • Line Follower            – 1 kg, 20×20×20 cm                        │
     *   │  • Manual Task              – 1 kg, 20×20×20 cm                        │
     *   │  • RoboSumo                 – 1 kg, 20×20×20 cm                        │
     *   ├─────────────────────────────────────────────────────────────────────────┤
     *   │ YOUNG ENGINEERS (12-18 yrs) – WIRELESS only, age group YOUTH           │
     *   │  • Robo Soccer              – 3 kg, 30×30×30 cm                        │
     *   │  • Line Follower (Auto)     – 1.5 kg, no size limit                    │
     *   │  • Theme-based Tasking      – 3 kg, no size limit                      │
     *   │  • RoboWar                  – 1.5 kg only (one EventSports row)        │
     *   │  • Drone Racing / Soccer    – 20 cm diagonal, 30×30×30 cm              │
     *   │  • RC Racing / Robo Racing  – extraRules only                          │
     *   ├─────────────────────────────────────────────────────────────────────────┤
     *   │ ROBO MINDS (18+ yrs) – WIRELESS only, age group OPEN                   │
     *   │  • Robo Soccer              – 5 kg, 45×45×45 cm                        │
     *   │  • Theme-based Tasking      – 5 kg, 45×45×45 cm                        │
     *   │  • RoboWar (5 weight rows)  – 1.5 / 8 / 15 / 30 / 60 kg each          │
     *   │  • Drone Racing (FPV) / Soccer – extraRules: fpv=true                  │
     *   │  • RC Racing                – extraRules: scale=1:8,1:12 fuel=nitro,.. │
     *   │  • Aeromodelling            – extraRules only                          │
     *   └─────────────────────────────────────────────────────────────────────────┘
     */
    public SportRegistration registerRobot(RegistrationRequest request) {

        UUID eventSportId = request.getEventSportId();
        UUID teamId       = request.getTeamId();
        UUID robotId      = request.getBotId();     // RegistrationRequest still exposes getBotId()

        // =================================================
        // 1. FIND EVENT SPORT
        // =================================================

        EventSports eventSport = eventSportsRepository
                .findById(eventSportId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Event sport not found: " + eventSportId));

        // =================================================
        // 2. STATUS CHECK
        // =================================================

        if (eventSport.getStatus() != SportEventStatus.REGISTRATION_OPEN) {
            throw new IllegalStateException(
                    "Registration is not open for this competition. " +
                    "Current status: " + eventSport.getStatus());
        }

        // =================================================
        // 3. DATE WINDOW CHECK
        // =================================================

        LocalDate today = LocalDate.now();
        if (!eventSport.isRegistrationOpen(today)) {
            throw new IllegalStateException(
                    "Registration window is not active. " +
                    "Open: " + eventSport.getRegistrationStartDate()
                    + " → " + eventSport.getRegistrationEndDate()
                    + "  (today: " + today + ")");
        }

        // =================================================
        // 4. CAPACITY CHECK
        // =================================================

        if (eventSport.isFull()) {
            throw new IllegalStateException(
                    "This competition is full (max " + eventSport.getMaxTeams() + " entries).");
        }

        // =================================================
        // 4.5 ELIGIBILITY — age category + guardian
        // =================================================

        if (request.getCallerId() != null) {

            User caller = userRepository.findById(request.getCallerId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "User not found: " + request.getCallerId()));

            if (caller.getDateOfBirth() == null) {
                throw new IllegalStateException(
                        "Date of birth is required for event registration. " +
                        "Please complete your profile first.");
            }

            int age = EligibilityUtils.calculateAge(caller.getDateOfBirth());
            AgeCategory callerCategory = EligibilityUtils.getCategoryForAge(age);

            if (callerCategory == null) {
                throw new IllegalStateException(
                        "You are not eligible for competition. " +
                        "Minimum age is " + EligibilityUtils.JUNIOR_MIN + " years " +
                        "(current age: " + age + ").");
            }

            if (eventSport.getAgeGroup() != null
                    && !eventSport.getAgeGroup().equals(callerCategory)) {
                throw new IllegalStateException(
                        "Age category mismatch: this sport is for "
                        + EligibilityUtils.toCategoryLabel(eventSport.getAgeGroup())
                        + " (" + EligibilityUtils.toCategoryAgeRange(eventSport.getAgeGroup()) + "), "
                        + "but your category is "
                        + EligibilityUtils.toCategoryLabel(callerCategory)
                        + " (age " + age + ").");
            }

            if (EligibilityUtils.requiresGuardian(caller.getDateOfBirth())
                    && !guardianRepository.existsByUserId(request.getCallerId())) {
                throw new IllegalStateException(
                        "Participants under 18 must have a guardian profile on file. " +
                        "Please add your guardian details in Profile → Guardian Info.");
            }
        }

        // =================================================
        // 5. FIND TEAM
        // =================================================

        Team team = teamRepository
                .findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Team not found: " + teamId));

        // =================================================
        // 6. FIND ROBOT  →  active check  →  ownership check
        // =================================================

        Robot robot = robotRepository
                .findById(robotId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Robot not found: " + robotId));

        // Reject soft-deleted or retired robots
        if (robot.getStatus() != RobotStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Robot '" + robot.getRobotName() + "' is not active " +
                    "(status: " + robot.getStatus() + "). " +
                    "Only ACTIVE robots can be registered.");
        }

        // Robot must belong to the registering team
        if (!robot.getTeamId().equals(teamId)) {
            throw new IllegalArgumentException(
                    "Robot '" + robot.getRobotName() + "' does not belong to team: " + teamId);
        }

        // =================================================
        // 6.5  SPORT COMPATIBILITY CHECK
        //   Robot must be built for the same sport as the event sport.
        //   e.g. a ROBOWAR_1_5KG robot cannot enter a ROBO_SOCCER event.
        // =================================================

        if (robot.getSport() != null && eventSport.getSport() != null) {
            Set<String> allowed = ROBOT_SPORT_TO_EVENT_SPORTS.get(
                    robot.getSport().toUpperCase());
            // If the robot sport is in our catalogue but doesn't match → reject.
            // If it's an unknown/custom sport key, skip the check.
            if (allowed != null && !allowed.contains(eventSport.getSport().toUpperCase())) {
                throw new IllegalStateException(
                        "Sport mismatch: robot '" + robot.getRobotName()
                        + "' is configured for '" + robot.getSport() + "' "
                        + "but this competition is '" + eventSport.getSport() + "'. "
                        + "Only robots built for this specific sport can register.");
            }
        }

        // =================================================
        // 6.6  WEIGHT CLASS CHECK
        //   The robot's weight class must match the event sport's weight class.
        //   We normalise both sides (replace '.' → '_', uppercase) before
        //   comparing, so "1.5KG" == "1_5KG".
        // =================================================

        if (robot.getWeightClass() != null && eventSport.getWeightClass() != null) {
            String robotWc = normalizeWeightClass(robot.getWeightClass());
            String sportWc = normalizeWeightClass(eventSport.getWeightClass());
            if (!robotWc.equals(sportWc)) {
                throw new IllegalStateException(
                        "Weight class mismatch: robot '" + robot.getRobotName()
                        + "' is in class '" + robot.getWeightClass()
                        + "' but this competition requires '" + eventSport.getWeightClass() + "'.");
            }
        }

        // =================================================
        // 7. DUPLICATE REGISTRATION CHECK
        //    Check both REGISTERED and PENDING – a pending registration
        //    still holds a slot and must not be double-entered.
        // =================================================

        boolean alreadyRegistered = sportRegistrationRepository
                .existsByEventSportIdAndRobotIdAndStatusIn(
                        eventSportId,
                        robotId,
                        List.of(RegistrationStatus.REGISTERED, RegistrationStatus.PENDING)
                );

        if (alreadyRegistered) {
            throw new IllegalStateException(
                    "Robot '" + robot.getRobotName() +
                    "' is already registered (or pending) in this competition.");
        }

        // =================================================
        // 7.5 REACTIVATE CANCELLED REGISTRATION
        //     If a CANCELLED row already exists for this (sport, robot), reuse
        //     it rather than inserting a new row — the unique constraint on
        //     (event_sport_id, team_id, robot_name) would otherwise reject the
        //     INSERT even though the previous entry was cancelled.
        // =================================================

        Optional<SportRegistration> cancelledOpt = sportRegistrationRepository
                .findByEventSportIdAndRobotIdAndStatus(
                        eventSportId, robotId, RegistrationStatus.CANCELLED);

        if (cancelledOpt.isPresent()) {
            SportRegistration existing = cancelledOpt.get();

            // Refresh snapshot — robot specs may have changed since the first registration
            existing.setWeightKg(robot.getWeightKg());
            existing.setLengthCm(robot.getLengthCm());
            existing.setWidthCm(robot.getWidthCm());
            existing.setHeightCm(robot.getHeightCm());
            existing.setControlType(robot.getControlType());
            existing.setControlMode(robot.getControlMode());
            existing.setStatus(RegistrationStatus.REGISTERED);

            existing.validateAgainst(eventSport);
            SportRegistration reactivated = sportRegistrationRepository.save(existing);

            realtimePublisher.pushRegistration(eventSport.getId(), eventSport.getEventId(),
                    java.util.Map.of(
                            "sportId",              eventSport.getId().toString(),
                            "eventId",              eventSport.getEventId().toString(),
                            "registeredTeamsCount", eventSport.getRegisteredTeamsCount() + 1,
                            "teamId",               team.getId().toString(),
                            "teamName",             team.getTeamName(),
                            "robotName",            robot.getRobotName()
                    ));

            try {
                UUID captainId = teamMembershipRepository
                        .findByTeamIdAndRoleInTeamAndStatus(team.getId(), TeamRole.CAPTAIN, TeamMembershipStatus.ACTIVE)
                        .map(m -> m.getUserId())
                        .orElse(team.getId());
                UUID organizerUserId = eventRepository.findById(eventSport.getEventId())
                        .map(e -> e.getCreatedBy()).orElse(null);
                chatService.createRegistrationChat(reactivated, captainId, organizerUserId);
            } catch (Exception ignored) {}

            auditLogService.log("ROBOT_REGISTERED", "REGISTRATION", reactivated.getId(),
                    robot.getRobotName() + " → " + eventSport.getSport(),
                    "CANCELLED", "REGISTERED");

            notificationService.systemNotify(
                    "Registration Confirmed: " + robot.getRobotName(),
                    team.getTeamName() + "'s robot has been registered for "
                            + eventSport.getSport() + ". Good luck!",
                    NotificationType.REGISTRATION_APPROVED,
                    NotificationPriority.MEDIUM,
                    NotificationTargetType.TEAM,
                    team.getId(),
                    "/events/" + eventSport.getEventId()
            );

            int curr = eventSport.getRegisteredTeamsCount() == null
                    ? 0 : eventSport.getRegisteredTeamsCount();
            eventSport.setRegisteredTeamsCount(curr + 1);
            eventSportsRepository.save(eventSport);

            return reactivated;
        }

        // =================================================
        // 8. MAX BOTS PER TEAM CHECK
        //    null  → no cap (Young Engineers / Robo Minds multi-bot sports)
        //    1     → Plug N Play (one bot handles both Race and Soccer)
        // =================================================

        Integer maxBotsPerTeam = eventSport.getMaxBotsPerTeam();
        if (maxBotsPerTeam != null) {

            long currentTeamBots = sportRegistrationRepository
                    .countByEventSportIdAndTeamIdAndStatusIn(
                            eventSportId,
                            teamId,
                            List.of(RegistrationStatus.REGISTERED, RegistrationStatus.PENDING)
                    );

            if (currentTeamBots >= maxBotsPerTeam) {
                throw new IllegalStateException(
                        "Your team has reached the maximum robots allowed for this competition: "
                        + maxBotsPerTeam + ". " +
                        "(Tip: For Plug N Play, one robot competes in both Race and Soccer.)");
            }
        }

        // =================================================
        // 9. BUILD REGISTRATION – snapshot robot specs
        //    Specs are frozen at registration time so bracket logic
        //    is not affected by future edits to the Robot record.
        // =================================================

        SportRegistration registration = new SportRegistration();

        registration.setEventId(eventSport.getEventId());
        registration.setEventSportId(eventSport.getId());
        registration.setTeamId(team.getId());
        registration.setRobotId(robot.getId());
        registration.setRobotName(robot.getRobotName());

        // Numeric specs from Robot (fields added in this PR to Robot entity)
        registration.setWeightKg(robot.getWeightKg());
        registration.setLengthCm(robot.getLengthCm());
        registration.setWidthCm(robot.getWidthCm());
        registration.setHeightCm(robot.getHeightCm());

        // Snapshot both control axes from the robot.
        registration.setControlType(robot.getControlType());   // autonomy: MANUAL / AUTONOMOUS / HYBRID
        registration.setControlMode(robot.getControlMode());   // connection: WIRED / WIRELESS

        registration.setStatus(RegistrationStatus.REGISTERED);

        // =================================================
        // 10. PHYSICAL SPEC VALIDATION
        //     SportRegistration.validateAgainst() checks:
        //       weightKg  <= EventSports.weightLimitKg
        //       lengthCm  <= EventSports.maxLengthCm
        //       widthCm   <= EventSports.maxWidthCm
        //       heightCm  <= EventSports.maxHeightCm
        //       controlType matches (skipped if competition allows ANY / null)
        //     Throws IllegalArgumentException with a descriptive message on failure.
        // =================================================

        registration.validateAgainst(eventSport);

        // =================================================
        // 11. SAVE
        // =================================================

        SportRegistration saved = sportRegistrationRepository.save(registration);

        // Push realtime registration count update to watchers
        realtimePublisher.pushRegistration(eventSport.getId(), eventSport.getEventId(),
                java.util.Map.of(
                        "sportId",              eventSport.getId().toString(),
                        "eventId",              eventSport.getEventId().toString(),
                        "registeredTeamsCount", eventSport.getRegisteredTeamsCount() + 1,
                        "teamId",               team.getId().toString(),
                        "teamName",             team.getTeamName(),
                        "robotName",            robot.getRobotName()
                ));

        // =================================================
        // CREATE REGISTRATION CHAT
        // =================================================

        try {
            // Find team captain
            UUID captainId = teamMembershipRepository
                    .findByTeamIdAndRoleInTeamAndStatus(team.getId(), TeamRole.CAPTAIN, TeamMembershipStatus.ACTIVE)
                    .map(m -> m.getUserId())
                    .orElse(team.getId());

            // Get organizer from the Event
            UUID organizerUserId = eventRepository.findById(eventSport.getEventId())
                    .map(e -> e.getCreatedBy())
                    .orElse(null);

            chatService.createRegistrationChat(saved, captainId, organizerUserId);
        } catch (Exception ignored) {
            // Chat creation failure must not roll back the registration
        }

        // =================================================
        // AUDIT + NOTIFY TEAM — registration confirmed
        // =================================================

        auditLogService.log("ROBOT_REGISTERED", "REGISTRATION", saved.getId(),
                robot.getRobotName() + " → " + eventSport.getSport(),
                null, "REGISTERED");

        notificationService.systemNotify(
                "Registration Confirmed: " + robot.getRobotName(),
                team.getTeamName() + "'s robot has been registered for "
                        + eventSport.getSport() + ". Good luck!",
                NotificationType.REGISTRATION_APPROVED,
                NotificationPriority.MEDIUM,
                NotificationTargetType.TEAM,
                team.getId(),
                "/events/" + eventSport.getEventId()
        );

        // =================================================
        // 12. INCREMENT COMPETITION HEADCOUNT
        //     registeredTeamsCount counts robot-entries for this competition.
        // =================================================

        int current = eventSport.getRegisteredTeamsCount() == null
                ? 0
                : eventSport.getRegisteredTeamsCount();
        eventSport.setRegisteredTeamsCount(current + 1);
        eventSportsRepository.save(eventSport);

        return saved;
    }

    // =====================================================
    // CANCEL REGISTRATION
    // =====================================================

    /**
     * Cancels a registration. Only REGISTERED or PENDING may be cancelled.
     * Frees the competition slot by decrementing registeredTeamsCount.
     */
    public void cancelRegistration(UUID registrationId, UUID callerId) {

        SportRegistration registration = sportRegistrationRepository
                .findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Registration not found: " + registrationId));

        // Ownership: only a CAPTAIN or VICE_CAPTAIN of the team that owns this
        // registration may cancel it (unless caller is the team itself via admin path).
        if (callerId != null) {
            boolean authorized = teamMembershipRepository
                    .findByTeamIdAndUserIdAndStatus(
                            registration.getTeamId(), callerId, TeamMembershipStatus.ACTIVE)
                    .map(m -> m.getRoleInTeam() == TeamRole.CAPTAIN
                           || m.getRoleInTeam() == TeamRole.VICE_CAPTAIN)
                    .orElse(false);
            if (!authorized) {
                throw com.botleague.backend.common.exception.ApiException
                        .forbidden("Only captains and vice-captains can cancel a registration");
            }
        }

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new IllegalStateException("Registration is already cancelled.");
        }

        if (registration.getStatus() != RegistrationStatus.REGISTERED
                && registration.getStatus() != RegistrationStatus.PENDING) {
            throw new IllegalStateException(
                    "Cannot cancel a registration in status: " + registration.getStatus());
        }

        registration.setStatus(RegistrationStatus.CANCELLED);
        sportRegistrationRepository.save(registration);
        auditLogService.log("REGISTRATION_CANCELLED", "REGISTRATION", registration.getId(),
                registration.getRobotName(), "REGISTERED", "CANCELLED");

        // Free the slot on the competition
        eventSportsRepository.findById(registration.getEventSportId())
                .ifPresent(eventSport -> {
                    int current = eventSport.getRegisteredTeamsCount() == null
                            ? 0
                            : eventSport.getRegisteredTeamsCount();
                    eventSport.setRegisteredTeamsCount(Math.max(0, current - 1));
                    eventSportsRepository.save(eventSport);
                });
    }

    // =====================================================
    // QUERIES
    // =====================================================

    /** Single registration by ID. */
    public SportRegistration getRegistrationById(UUID registrationId) {

        return sportRegistrationRepository
                .findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Registration not found: " + registrationId));
    }

    /** All active (REGISTERED) robots in one competition. */
    public List<SportRegistration> getRegistrationsByEventSport(UUID eventSportId) {

        return sportRegistrationRepository
                .findByEventSportIdAndStatus(eventSportId, RegistrationStatus.REGISTERED);
    }

    /** All active registrations for a team, across all sports/events. */
    public List<SportRegistration> getRegistrationsByTeam(UUID teamId) {

        return sportRegistrationRepository
                .findByTeamIdAndStatus(teamId, RegistrationStatus.REGISTERED);
    }

    /**
     * A team's robots in one specific competition.
     * For RoboWar each weight-class is its own EventSports row,
     * so robots across weight classes appear as separate results.
     */
    public List<SportRegistration> getTeamRobotsInSport(UUID eventSportId, UUID teamId) {

        return sportRegistrationRepository
                .findByEventSportIdAndTeamIdAndStatus(
                        eventSportId, teamId, RegistrationStatus.REGISTERED);
    }

    /** All active registrations across every sport in one event. */
    public List<SportRegistration> getRegistrationsByEvent(UUID eventId) {

        return sportRegistrationRepository
                .findByEventIdAndStatus(eventId, RegistrationStatus.REGISTERED);
    }

    // =====================================================
    // MAPPER  SportRegistration → EventRegistrationResponse
    // Resolves teamName, sportName, eventName via repositories.
    // =====================================================

    public EventRegistrationResponse mapToResponse(SportRegistration registration) {

        EventRegistrationResponse response = new EventRegistrationResponse();

        response.setRegistrationId(registration.getId());
        response.setEventId(registration.getEventId());
        response.setEventSportId(registration.getEventSportId());
        response.setTeamId(registration.getTeamId());
        response.setBotId(registration.getRobotId());
        response.setRobotName(registration.getRobotName());
        response.setStatus(registration.getStatus());

        // Resolve human-readable names
        if (registration.getTeamId() != null) {
            teamRepository.findById(registration.getTeamId())
                    .ifPresent(t -> response.setTeamName(t.getTeamName()));
        }
        if (registration.getEventSportId() != null) {
            eventSportsRepository.findById(registration.getEventSportId())
                    .ifPresent(s -> response.setSportName(s.getSport()));
        }
        if (registration.getEventId() != null) {
            eventRepository.findById(registration.getEventId())
                    .ifPresent(e -> response.setEventName(e.getEventName()));
        }

        // Physical spec snapshot stored at registration time
        response.setWeightKg(registration.getWeightKg());
        response.setLengthCm(registration.getLengthCm());
        response.setWidthCm(registration.getWidthCm());
        response.setHeightCm(registration.getHeightCm());
        if (registration.getControlType() != null) {
            response.setControlType(ControlType.valueOf(registration.getControlType().name()));
        }
        if (registration.getControlMode() != null) {
            response.setControlMode(ControlMode.valueOf(registration.getControlMode().name()));
        }

        response.setCreatedAt(registration.getRegisteredAt());

        return response;
    }

    // =========================================================================
    // SPORT COMPATIBILITY MAP
    //   key   = robot.sport value (stored during robot creation)
    //   value = set of event sport names (EventSports.sport) the robot may enter
    // =========================================================================

    private static final Map<String, Set<String>> ROBOT_SPORT_TO_EVENT_SPORTS = Map.ofEntries(
        Map.entry("ROBOWAR_1_5KG",  Set.of("ROBO_WAR", "ROBO_WAR_OPEN")),
        Map.entry("ROBOWAR_8KG",    Set.of("ROBO_WAR", "ROBO_WAR_OPEN")),
        Map.entry("ROBOWAR_15KG",   Set.of("ROBO_WAR", "ROBO_WAR_OPEN")),
        Map.entry("ROBOWAR_30KG",   Set.of("ROBO_WAR", "ROBO_WAR_OPEN")),
        Map.entry("ROBOWAR_60KG",   Set.of("ROBO_WAR", "ROBO_WAR_OPEN")),
        Map.entry("ROBO_SOCCER",    Set.of("ROBO_SOCCER", "ROBO_SOCCER_OPEN")),
        Map.entry("PLUG_N_PLAY_SOCCER", Set.of("PLUG_N_PLAY_RACE_SOCCER")),
        Map.entry("ROBO_SUMO",          Set.of("ROBO_SUMO")),
        Map.entry("LINE_FOLLOWER",       Set.of("LINE_FOLLOWER")),
        Map.entry("LINE_FOLLOWER_AUTO",  Set.of("LINE_FOLLOWER", "LINE_FOLLOWER_AUTO")),
        Map.entry("MANUAL_TASK",         Set.of("MANUAL_TASK")),
        Map.entry("THEME_BASED_TASKING", Set.of("THEME_BASED_TASKING", "THEME_BASED_TASKING_OPEN")),
        Map.entry("DRONE_RACING",        Set.of("DRONE_RACING_FPV", "DRONE_RACING_SOCCER")),
        Map.entry("DRONE_SOCCER",        Set.of("DRONE_RACING_SOCCER")),
        Map.entry("RC_RACING",           Set.of("RC_ROBO_RACING", "RC_RACING_NITRO")),
        Map.entry("AEROMODELLING",       Set.of("AEROMODELLING")),
        Map.entry("PROJECT_BASED",       Set.of("PROJECT_BASED"))
    );

    /** Normalise weight class strings so "1.5KG" == "1_5KG" == "1_5KG". */
    private static String normalizeWeightClass(String wc) {
        return wc.toUpperCase().replace('.', '_');
    }
}