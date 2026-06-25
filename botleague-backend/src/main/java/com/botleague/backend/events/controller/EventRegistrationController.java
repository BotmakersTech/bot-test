package com.botleague.backend.events.controller;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.common.security.SecurityUtils;
import com.botleague.backend.events.dto.EventRegistrationRequestDTO;
import com.botleague.backend.events.dto.EventRegistrationResponse;
import com.botleague.backend.events.dto.RegistrationRequest;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.service.SportRegistrationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/event-registrations")
public class EventRegistrationController {

    // =====================================================
    // DEPENDENCIES
    // =====================================================

    private final SportRegistrationService sportRegistrationService;

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    public EventRegistrationController(
            SportRegistrationService sportRegistrationService
    ) {
        this.sportRegistrationService = sportRegistrationService;
    }

    // =====================================================
    // REGISTER ROBOT
    // POST /api/event-registrations
    // =====================================================

    @PostMapping
    public ResponseEntity<EventRegistrationResponse> registerRobot(
            @Valid
            @RequestBody
            EventRegistrationRequestDTO request,
            Authentication authentication
    ) {

        RegistrationRequest registrationRequest = new RegistrationRequest();
        registrationRequest.setEventSportId(request.getEventSportId());
        registrationRequest.setTeamId(request.getTeamId());
        registrationRequest.setBotId(request.getBotId());
        registrationRequest.setCallerId(SecurityUtils.currentUserId(authentication));

        SportRegistration registration =
                sportRegistrationService.registerRobot(registrationRequest);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(sportRegistrationService.mapToResponse(registration));
    }

    // =====================================================
    // GET REGISTRATION BY ID
    // GET /api/event-registrations/{registrationId}
    // =====================================================

    @GetMapping("/{registrationId}")
    public ResponseEntity<EventRegistrationResponse> getRegistrationById(
            @PathVariable UUID registrationId
    ) {

        SportRegistration registration =
                sportRegistrationService.getRegistrationById(registrationId);

        return ResponseEntity.ok(sportRegistrationService.mapToResponse(registration));
    }

    // =====================================================
    // GET ALL REGISTRATIONS IN A COMPETITION (EventSport)
    // GET /api/event-registrations/event-sport/{eventSportId}
    // =====================================================

    @GetMapping("/event-sport/{eventSportId}")
    public ResponseEntity<List<EventRegistrationResponse>> getRegistrationsByEventSport(
            @PathVariable UUID eventSportId
    ) {

        List<EventRegistrationResponse> responses =
                sportRegistrationService
                        .getRegistrationsByEventSport(eventSportId)
                        .stream()
                        .map(sportRegistrationService::mapToResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // =====================================================
    // GET TEAM REGISTRATIONS (all sports / events)
    // GET /api/event-registrations/team/{teamId}
    // =====================================================

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<EventRegistrationResponse>> getRegistrationsByTeam(
            @PathVariable UUID teamId
    ) {

        List<EventRegistrationResponse> responses =
                sportRegistrationService
                        .getRegistrationsByTeam(teamId)
                        .stream()
                        .map(sportRegistrationService::mapToResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // =====================================================
    // GET TEAM ROBOTS IN ONE COMPETITION
    // GET /api/event-registrations/event-sport/{eventSportId}/team/{teamId}
    // =====================================================

    @GetMapping("/event-sport/{eventSportId}/team/{teamId}")
    public ResponseEntity<List<EventRegistrationResponse>> getTeamRobotsInSport(
            @PathVariable UUID eventSportId,
            @PathVariable UUID teamId
    ) {

        List<EventRegistrationResponse> responses =
                sportRegistrationService
                        .getTeamRobotsInSport(eventSportId, teamId)
                        .stream()
                        .map(sportRegistrationService::mapToResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // =====================================================
    // GET ALL REGISTRATIONS IN AN EVENT
    // GET /api/event-registrations/event/{eventId}
    // =====================================================

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<EventRegistrationResponse>> getRegistrationsByEvent(
            @PathVariable UUID eventId
    ) {

        List<EventRegistrationResponse> responses =
                sportRegistrationService
                        .getRegistrationsByEvent(eventId)
                        .stream()
                        .map(sportRegistrationService::mapToResponse)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    // =====================================================
    // CANCEL REGISTRATION
    // DELETE /api/event-registrations/{registrationId}
    // =====================================================

    @DeleteMapping("/{registrationId}")
    public ResponseEntity<String> cancelRegistration(
            @PathVariable UUID registrationId,
            Authentication authentication
    ) {
        UUID callerId = SecurityUtils.currentUserId(authentication);
        sportRegistrationService.cancelRegistration(registrationId, callerId);
        return ResponseEntity.ok("Registration cancelled successfully");
    }

}