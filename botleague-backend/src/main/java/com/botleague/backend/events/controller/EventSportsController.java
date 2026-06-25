package com.botleague.backend.events.controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.events.dto.EventSportsRequestDTO;
import com.botleague.backend.events.dto.GetEventSportsDTO;
import com.botleague.backend.events.dto.UpdateSportsDTO;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.service.EventSportsService;

@RestController
@RequestMapping("/api/events/{eventId}/sports")
public class EventSportsController {

    private final EventSportsService service;

    public EventSportsController(EventSportsService service) {
        this.service = service;
    }

    // =========================
    // CREATE SPORT
    // =========================
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<EventSports> createEventSport(
            @PathVariable UUID eventId,
            @Valid @RequestBody EventSportsRequestDTO dto) {

        dto.setEventId(eventId); // enforce path consistency
        EventSports response = service.addSport(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // =========================
    // UPDATE SPORT
    // =========================
    @PatchMapping("/{sportId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
    public ResponseEntity<String> updateEventSport(
            @PathVariable UUID eventId,
            @PathVariable UUID sportId,
            @Valid @RequestBody UpdateSportsDTO dto) {

        dto.setEventId(eventId);
        dto.setSportId(sportId);
        service.updateSports(dto);
        return ResponseEntity.ok("Sport updated successfully");
    }

    // =========================
    // TOGGLE REGISTRATION OPEN/CLOSED
    // =========================
    @PatchMapping("/{sportId}/registration")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER','ORGANIZER')")
    public ResponseEntity<String> toggleRegistration(
            @PathVariable UUID eventId,
            @PathVariable UUID sportId) {

        String status = service.updateSportsRegistration(sportId, eventId);
        return ResponseEntity.ok("Registration status updated to " + status);
    }

    // =========================
    // LIST SPORTS FOR AN EVENT
    // Public — any visitor browsing the event page must be able to see sports.
    // =========================
    @GetMapping
    public ResponseEntity<List<GetEventSportsDTO>> getEventSports(
            @PathVariable UUID eventId) {

        List<GetEventSportsDTO> response = service.getEventSports(eventId);
        return ResponseEntity.ok(response);
    }
}