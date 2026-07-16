package com.botleague.backend.organizer.controller;

import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.events.dto.CreateEventResponseDTO;
import com.botleague.backend.events.dto.EventRegistrationResponse;
import com.botleague.backend.events.dto.GetEventSportsDTO;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.service.EventSportsService;
import com.botleague.backend.events.service.SportRegistrationService;
import com.botleague.backend.organizer.dto.OrganizerDTOs.*;
import com.botleague.backend.organizer.dto.UpdateEventInfoDTO;
import com.botleague.backend.organizer.dto.UpdateRegistrationStatusRequest;
import com.botleague.backend.organizer.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizer")
public class OrganizerController {

    private final OrganizerService             organizerService;
    private final OrganizerPeopleService       peopleService;
    private final OrganizerCommunicationService communicationService;
    private final OrganizerVenueAndCertService  venueAndCertService;
    private final OrganizerDashboardService    dashboardService;
    private final EventSportsService           eventSportsService;
    private final SportRegistrationService     registrationService;
    private final AuthorizationService         authorizationService;

    public OrganizerController(
            OrganizerService             organizerService,
            OrganizerPeopleService       peopleService,
            OrganizerCommunicationService communicationService,
            OrganizerVenueAndCertService  venueAndCertService,
            OrganizerDashboardService    dashboardService,
            EventSportsService           eventSportsService,
            SportRegistrationService     registrationService,
            AuthorizationService         authorizationService) {
        this.organizerService    = organizerService;
        this.peopleService       = peopleService;
        this.communicationService= communicationService;
        this.venueAndCertService = venueAndCertService;
        this.dashboardService    = dashboardService;
        this.eventSportsService  = eventSportsService;
        this.registrationService = registrationService;
        this.authorizationService = authorizationService;
    }

    // =========================================================================
    // DASHBOARD
    // =========================================================================

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<DashboardStatsResponse> getDashboard(Authentication auth) {
        return ResponseEntity.ok(
            dashboardService.getStats(extractUserId(auth), extractRoles(auth)));
    }

    // =========================================================================
    // EVENT — My Events, Info Update
    // =========================================================================

    @GetMapping("/my-events")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<List<CreateEventResponseDTO>> getMyEvents(Authentication auth) {
        return ResponseEntity.ok(
            organizerService.getMyEvents(extractUserId(auth), extractRoles(auth)));
    }

    @GetMapping("/my-sports")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<List<GetEventSportsDTO>> getMySports(Authentication auth) {
        return ResponseEntity.ok(
            organizerService.getMySports(extractUserId(auth), extractRoles(auth)));
    }

    /** Organiser-safe event info update (no sport spec changes) */
    @PatchMapping("/events/{eventId}/info")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<CreateEventResponseDTO> updateEventInfo(
            @PathVariable UUID eventId,
            @RequestBody UpdateEventInfoDTO request,
            Authentication auth) {
        return ResponseEntity.ok(
            organizerService.updateEventInfo(eventId, extractUserId(auth), extractRoles(auth), request));
    }

    // =========================================================================
    // SPORT LIFECYCLE
    // =========================================================================

    @PostMapping("/events/{eventId}/sports/{sportId}/submit-approval")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<GetEventSportsDTO> submitSportForApproval(
            @PathVariable UUID eventId,
            @PathVariable UUID sportId) {
        return ResponseEntity.ok(eventSportsService.submitForApproval(sportId, eventId));
    }

    // =========================================================================
    // ADMIN PICKERS (MANAGER+)
    // =========================================================================

    @GetMapping("/admin/events")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<CreateEventResponseDTO>> getAllEventsForAdmin() {
        return ResponseEntity.ok(organizerService.getAllEventsForAdmin());
    }

    @GetMapping("/admin/events/{eventId}/sports")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<GetEventSportsDTO>> getSportsByEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(organizerService.getSportsByEvent(eventId));
    }

    // =========================================================================
    // ARENAS
    // =========================================================================

    @GetMapping("/events/{eventId}/arenas")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<List<ArenaResponse>> getArenas(@PathVariable UUID eventId) {
        return ResponseEntity.ok(peopleService.getArenas(eventId));
    }

    @PostMapping("/events/{eventId}/arenas")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<ArenaResponse> createArena(
            @PathVariable UUID eventId, @RequestBody ArenaRequest req) {
        return ResponseEntity.ok(peopleService.createArena(eventId, req));
    }

    @PutMapping("/events/{eventId}/arenas/{arenaId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<ArenaResponse> updateArena(
            @PathVariable UUID eventId, @PathVariable UUID arenaId, @RequestBody ArenaRequest req) {
        return ResponseEntity.ok(peopleService.updateArena(arenaId, req));
    }

    @DeleteMapping("/events/{eventId}/arenas/{arenaId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<Void> deleteArena(
            @PathVariable UUID eventId, @PathVariable UUID arenaId) {
        peopleService.deleteArena(arenaId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // VOLUNTEERS
    // =========================================================================

    @GetMapping("/events/{eventId}/volunteers")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<List<VolunteerResponse>> getVolunteers(@PathVariable UUID eventId) {
        return ResponseEntity.ok(peopleService.getVolunteers(eventId));
    }

    @PostMapping("/events/{eventId}/volunteers")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<VolunteerResponse> createVolunteer(
            @PathVariable UUID eventId, @RequestBody VolunteerRequest req) {
        return ResponseEntity.ok(peopleService.createVolunteer(eventId, req));
    }

    @PutMapping("/events/{eventId}/volunteers/{volunteerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<VolunteerResponse> updateVolunteer(
            @PathVariable UUID eventId,
            @PathVariable UUID volunteerId,
            @RequestBody VolunteerRequest req) {
        return ResponseEntity.ok(peopleService.updateVolunteer(volunteerId, req));
    }

    @PatchMapping("/events/{eventId}/volunteers/{volunteerId}/checkin")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<VolunteerResponse> checkInVolunteer(
            @PathVariable UUID eventId, @PathVariable UUID volunteerId) {
        return ResponseEntity.ok(peopleService.checkInVolunteer(volunteerId));
    }

    @PatchMapping("/events/{eventId}/volunteers/{volunteerId}/checkout")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<VolunteerResponse> checkOutVolunteer(
            @PathVariable UUID eventId, @PathVariable UUID volunteerId) {
        return ResponseEntity.ok(peopleService.checkOutVolunteer(volunteerId));
    }

    @DeleteMapping("/events/{eventId}/volunteers/{volunteerId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<Void> deleteVolunteer(
            @PathVariable UUID eventId, @PathVariable UUID volunteerId) {
        peopleService.deleteVolunteer(volunteerId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // JUDGES
    // =========================================================================

    @GetMapping("/events/{eventId}/judges")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<List<JudgeResponse>> getJudges(@PathVariable UUID eventId) {
        return ResponseEntity.ok(peopleService.getJudges(eventId));
    }

    @PostMapping("/events/{eventId}/judges")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<JudgeResponse> createJudge(
            @PathVariable UUID eventId, @RequestBody JudgeRequest req) {
        return ResponseEntity.ok(peopleService.createJudge(eventId, req));
    }

    @PutMapping("/events/{eventId}/judges/{judgeId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<JudgeResponse> updateJudge(
            @PathVariable UUID eventId,
            @PathVariable UUID judgeId,
            @RequestBody JudgeRequest req) {
        return ResponseEntity.ok(peopleService.updateJudge(judgeId, req));
    }

    @DeleteMapping("/events/{eventId}/judges/{judgeId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<Void> deleteJudge(
            @PathVariable UUID eventId, @PathVariable UUID judgeId) {
        peopleService.deleteJudge(judgeId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // STAFF
    // =========================================================================

    @GetMapping("/events/{eventId}/staff")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<List<StaffResponse>> getStaff(@PathVariable UUID eventId) {
        return ResponseEntity.ok(peopleService.getStaff(eventId));
    }

    @PostMapping("/events/{eventId}/staff")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<StaffResponse> createStaff(
            @PathVariable UUID eventId, @RequestBody StaffRequest req) {
        return ResponseEntity.ok(peopleService.createStaff(eventId, req));
    }

    @PutMapping("/events/{eventId}/staff/{staffId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<StaffResponse> updateStaff(
            @PathVariable UUID eventId,
            @PathVariable UUID staffId,
            @RequestBody StaffRequest req) {
        return ResponseEntity.ok(peopleService.updateStaff(staffId, req));
    }

    @PatchMapping("/events/{eventId}/staff/{staffId}/checkin")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<StaffResponse> checkInStaff(
            @PathVariable UUID eventId, @PathVariable UUID staffId) {
        return ResponseEntity.ok(peopleService.checkInStaff(staffId));
    }

    @PatchMapping("/events/{eventId}/staff/{staffId}/checkout")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<StaffResponse> checkOutStaff(
            @PathVariable UUID eventId, @PathVariable UUID staffId) {
        return ResponseEntity.ok(peopleService.checkOutStaff(staffId));
    }

    @DeleteMapping("/events/{eventId}/staff/{staffId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<Void> deleteStaff(
            @PathVariable UUID eventId, @PathVariable UUID staffId) {
        peopleService.deleteStaff(staffId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // ANNOUNCEMENTS
    // =========================================================================

    @GetMapping("/events/{eventId}/announcements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<List<AnnouncementResponse>> getAnnouncements(@PathVariable UUID eventId) {
        return ResponseEntity.ok(communicationService.getAnnouncements(eventId));
    }

    @PostMapping("/events/{eventId}/announcements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(
            @PathVariable UUID eventId,
            @RequestBody AnnouncementRequest req,
            Authentication auth) {
        return ResponseEntity.ok(
            communicationService.createAnnouncement(eventId, extractUserId(auth), req));
    }

    @PutMapping("/events/{eventId}/announcements/{announcementId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(
            @PathVariable UUID eventId,
            @PathVariable UUID announcementId,
            @RequestBody AnnouncementRequest req) {
        return ResponseEntity.ok(communicationService.updateAnnouncement(announcementId, req));
    }

    @DeleteMapping("/events/{eventId}/announcements/{announcementId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<Void> deleteAnnouncement(
            @PathVariable UUID eventId, @PathVariable UUID announcementId) {
        communicationService.deleteAnnouncement(announcementId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // INCIDENTS (MONITORING)
    // =========================================================================

    @GetMapping("/events/{eventId}/incidents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<List<IncidentResponse>> getIncidents(@PathVariable UUID eventId) {
        return ResponseEntity.ok(communicationService.getIncidents(eventId));
    }

    @PostMapping("/events/{eventId}/incidents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<IncidentResponse> createIncident(
            @PathVariable UUID eventId,
            @RequestBody IncidentRequest req,
            Authentication auth) {
        return ResponseEntity.ok(
            communicationService.createIncident(eventId, extractUserId(auth), req));
    }

    @PatchMapping("/events/{eventId}/incidents/{incidentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<IncidentResponse> updateIncident(
            @PathVariable UUID eventId,
            @PathVariable UUID incidentId,
            @RequestBody IncidentUpdateRequest req) {
        return ResponseEntity.ok(communicationService.updateIncident(incidentId, req));
    }

    @DeleteMapping("/events/{eventId}/incidents/{incidentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<Void> deleteIncident(
            @PathVariable UUID eventId, @PathVariable UUID incidentId) {
        communicationService.deleteIncident(incidentId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // REGISTRATIONS (ROSTER MANAGEMENT)
    // =========================================================================

    // Full roster (all statuses) — the public/bracket-facing
    // /event-registrations/event-sport/{sportId} endpoint only returns
    // REGISTERED entries, so organizers need this to see and restore
    // WAITLISTED/REJECTED/CHECKED_IN registrations.
    @GetMapping("/events/{eventId}/sports/{sportId}/registrations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<List<EventRegistrationResponse>> getAllRegistrationsForSport(
            Authentication authentication,
            @PathVariable UUID eventId,
            @PathVariable UUID sportId) {
        UUID callerId = extractUserId(authentication);
        authorizationService.assertCanViewEvent(callerId, eventId);
        return ResponseEntity.ok(
                registrationService.getAllRegistrationsByEventSport(sportId).stream()
                        .map(registrationService::mapToResponse)
                        .collect(Collectors.toList()));
    }

    @PatchMapping("/events/{eventId}/registrations/{registrationId}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<EventRegistrationResponse> updateRegistrationStatus(
            Authentication authentication,
            @PathVariable UUID eventId,
            @PathVariable UUID registrationId,
            @RequestBody UpdateRegistrationStatusRequest req) {
        UUID callerId = extractUserId(authentication);
        // Sport-scoped check (a strict superset of the event-scoped one —
        // canManageSport() already falls back to canManageEvent() first) so
        // a SPORT_HEAD can manage registrations for their own sport, not
        // just an EVENT_HEAD/ORGANISER/ADMIN.
        UUID eventSportId = registrationService.getRegistrationById(registrationId).getEventSportId();
        authorizationService.assertCanManageSport(callerId, eventSportId);

        RegistrationStatus newStatus;
        try {
            newStatus = RegistrationStatus.valueOf(req.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown registration status: " + req.getStatus());
        }
        return ResponseEntity.ok(registrationService.mapToResponse(
                registrationService.updateRegistrationStatus(registrationId, newStatus, req.getReason())));
    }

    // =========================================================================
    // SPORT ANNOUNCEMENTS — one-way organiser -> sport participants
    // =========================================================================

    @PostMapping("/events/{eventId}/sports/{sportId}/announce")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<AnnouncementResponse> sendSportAnnouncement(
            Authentication authentication,
            @PathVariable UUID eventId,
            @PathVariable UUID sportId,
            @jakarta.validation.Valid @RequestBody com.botleague.backend.organizer.dto.SportAnnounceRequest req) {
        UUID callerId = extractUserId(authentication);
        authorizationService.assertCanManageSport(callerId, sportId);
        return ResponseEntity.ok(communicationService.sendSportAnnouncement(eventId, sportId, callerId, req));
    }

    @GetMapping("/events/{eventId}/sports/{sportId}/announcements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<List<AnnouncementResponse>> getSportAnnouncementsForOrganizer(
            Authentication authentication,
            @PathVariable UUID eventId,
            @PathVariable UUID sportId) {
        authorizationService.assertCanManageSport(extractUserId(authentication), sportId);
        return ResponseEntity.ok(communicationService.getSportAnnouncementsForOrganizer(sportId));
    }

    // =========================================================================
    // SUPPORT CONTACTS
    // =========================================================================

    @GetMapping("/events/{eventId}/support-contacts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<List<SupportContactResponse>> getSupportContacts(
            Authentication authentication,
            @PathVariable UUID eventId,
            @RequestParam(required = false) UUID sportId) {
        UUID callerId = extractUserId(authentication);
        if (sportId != null) authorizationService.assertCanManageSport(callerId, sportId);
        else authorizationService.assertCanManageEvent(callerId, eventId);
        return ResponseEntity.ok(communicationService.getSupportContacts(eventId, sportId));
    }

    @PostMapping("/events/{eventId}/support-contacts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<SupportContactResponse> createSupportContact(
            Authentication authentication,
            @PathVariable UUID eventId,
            @RequestBody SupportContactRequest req) {
        UUID callerId = extractUserId(authentication);
        if (req.eventSportId != null) authorizationService.assertCanManageSport(callerId, req.eventSportId);
        else authorizationService.assertCanManageEvent(callerId, eventId);
        return ResponseEntity.ok(communicationService.createSupportContact(eventId, req));
    }

    @PutMapping("/events/{eventId}/support-contacts/{contactId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<SupportContactResponse> updateSupportContact(
            Authentication authentication,
            @PathVariable UUID eventId,
            @PathVariable UUID contactId,
            @RequestBody SupportContactRequest req) {
        UUID callerId = extractUserId(authentication);
        assertCanManageContact(callerId, eventId, communicationService.getSupportContactEventSportId(contactId));
        return ResponseEntity.ok(communicationService.updateSupportContact(contactId, req));
    }

    @DeleteMapping("/events/{eventId}/support-contacts/{contactId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD','SPORT_HEAD')")
    public ResponseEntity<Void> deleteSupportContact(
            Authentication authentication,
            @PathVariable UUID eventId,
            @PathVariable UUID contactId) {
        UUID callerId = extractUserId(authentication);
        assertCanManageContact(callerId, eventId, communicationService.getSupportContactEventSportId(contactId));
        communicationService.deleteSupportContact(contactId);
        return ResponseEntity.noContent().build();
    }

    private void assertCanManageContact(UUID callerId, UUID eventId, UUID eventSportId) {
        if (eventSportId != null) authorizationService.assertCanManageSport(callerId, eventSportId);
        else authorizationService.assertCanManageEvent(callerId, eventId);
    }

    // =========================================================================
    // VENUE & LOGISTICS
    // =========================================================================

    @GetMapping("/events/{eventId}/venue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<VenueDetailResponse> getVenueDetail(@PathVariable UUID eventId) {
        return ResponseEntity.ok(venueAndCertService.getVenueDetail(eventId));
    }

    @PutMapping("/events/{eventId}/venue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<VenueDetailResponse> upsertVenueDetail(
            @PathVariable UUID eventId, @RequestBody VenueDetailRequest req) {
        return ResponseEntity.ok(venueAndCertService.upsertVenueDetail(eventId, req));
    }

    // =========================================================================
    // CERTIFICATES
    // =========================================================================

    @GetMapping("/events/{eventId}/certificates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<List<CertificateResponse>> getCertificates(@PathVariable UUID eventId) {
        return ResponseEntity.ok(venueAndCertService.getCertificates(eventId));
    }

    @PostMapping("/events/{eventId}/certificates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<CertificateResponse> issueCertificate(
            @PathVariable UUID eventId, @RequestBody CertificateRequest req) {
        return ResponseEntity.ok(venueAndCertService.issueCertificate(eventId, req));
    }

    @PutMapping("/events/{eventId}/certificates/{certId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<CertificateResponse> updateCertificate(
            @PathVariable UUID eventId, @PathVariable UUID certId, @RequestBody CertificateRequest req) {
        return ResponseEntity.ok(venueAndCertService.updateCertificate(certId, req));
    }

    @DeleteMapping("/events/{eventId}/certificates/{certId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ORGANISER','EVENT_HEAD')")
    public ResponseEntity<Void> deleteCertificate(
            @PathVariable UUID eventId, @PathVariable UUID certId) {
        venueAndCertService.deleteCertificate(certId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }

    private List<String> extractRoles(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replace("ROLE_", ""))
                .collect(Collectors.toList());
    }
}
