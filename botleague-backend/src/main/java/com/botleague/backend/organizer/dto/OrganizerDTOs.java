package com.botleague.backend.organizer.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * All organiser-module request / response DTOs in one file.
 * Split into separate files if the module grows.
 */
public final class OrganizerDTOs {

    private OrganizerDTOs() {}

    // =========================================================================
    // DASHBOARD
    // =========================================================================

    public static class DashboardStatsResponse {
        public int totalEvents;
        public int liveEvents;
        public int upcomingEvents;
        public int completedEvents;
        public long totalRegistrations;
        public long totalTeams;
        public long totalVolunteers;
        public long totalJudges;
        public long totalStaff;
        public long totalMatches;
        public long pendingApprovals;
        public long openIncidents;
    }

    // =========================================================================
    // ARENA
    // =========================================================================

    public static class ArenaRequest {
        public String arenaName;
        public Integer capacity;
        public String locationNotes;
        public String sportType;
    }

    public static class ArenaResponse {
        public UUID id;
        public UUID eventId;
        public String arenaName;
        public Integer capacity;
        public String locationNotes;
        public String sportType;
        public Boolean isActive;
        public LocalDateTime createdAt;
    }

    // =========================================================================
    // VOLUNTEER
    // =========================================================================

    public static class VolunteerRequest {
        public String name;
        public String email;
        public String phone;
        public String dutyStation;
        public String shift;
        public String notes;
    }

    public static class VolunteerResponse {
        public UUID id;
        public UUID eventId;
        public String name;
        public String email;
        public String phone;
        public String dutyStation;
        public String shift;
        public String notes;
        public LocalDateTime checkedInAt;
        public LocalDateTime checkedOutAt;
        public LocalDateTime createdAt;
    }

    // =========================================================================
    // JUDGE
    // =========================================================================

    public static class JudgeRequest {
        public String name;
        public String email;
        public String phone;
        public String credentials;
        public UUID assignedSportId;
        public String assignedArena;
        public Boolean scoringRights;
        public String notes;
    }

    public static class JudgeResponse {
        public UUID id;
        public UUID eventId;
        public String name;
        public String email;
        public String phone;
        public String credentials;
        public UUID assignedSportId;
        public String assignedArena;
        public Boolean scoringRights;
        public String notes;
        public LocalDateTime createdAt;
    }

    // =========================================================================
    // STAFF
    // =========================================================================

    public static class StaffRequest {
        public String name;
        public String email;
        public String phone;
        public String staffType;
        public String dutyDescription;
        public String shift;
    }

    public static class StaffResponse {
        public UUID id;
        public UUID eventId;
        public String name;
        public String email;
        public String phone;
        public String staffType;
        public String dutyDescription;
        public String shift;
        public LocalDateTime checkedInAt;
        public LocalDateTime checkedOutAt;
        public LocalDateTime createdAt;
    }

    // =========================================================================
    // ANNOUNCEMENT
    // =========================================================================

    public static class AnnouncementRequest {
        public String title;
        public String body;
        public String targetType;
        public UUID targetSportId;
        public Boolean isPinned;
    }

    public static class AnnouncementResponse {
        public UUID id;
        public UUID eventId;
        public String title;
        public String body;
        public String targetType;
        public UUID targetSportId;
        public Boolean isPinned;
        public LocalDateTime sentAt;
        public LocalDateTime createdAt;
    }

    // =========================================================================
    // INCIDENT
    // =========================================================================

    public static class IncidentRequest {
        public String title;
        public String description;
        public String severity;
        public String arenaName;
    }

    public static class IncidentUpdateRequest {
        public String status;
        public String resolutionNotes;
    }

    public static class IncidentResponse {
        public UUID id;
        public UUID eventId;
        public String title;
        public String description;
        public String severity;
        public String status;
        public String arenaName;
        public String resolutionNotes;
        public LocalDateTime resolvedAt;
        public LocalDateTime createdAt;
    }

    // =========================================================================
    // VENUE DETAIL
    // =========================================================================

    public static class VenueDetailRequest {
        public String floorPlanUrl;
        public Integer arenaCount;
        public Integer seatingCapacity;
        public Boolean hasPower;
        public Boolean hasInternet;
        public Boolean hasMedicalFacility;
        public Integer parkingCapacity;
        public String emergencyContactName;
        public String emergencyContactPhone;
        public Boolean safetyCompliant;
        public String checklistJson;
        public String additionalNotes;
    }

    public static class VenueDetailResponse {
        public UUID id;
        public UUID eventId;
        public String floorPlanUrl;
        public Integer arenaCount;
        public Integer seatingCapacity;
        public Boolean hasPower;
        public Boolean hasInternet;
        public Boolean hasMedicalFacility;
        public Integer parkingCapacity;
        public String emergencyContactName;
        public String emergencyContactPhone;
        public Boolean safetyCompliant;
        public String checklistJson;
        public String additionalNotes;
        public LocalDateTime updatedAt;
    }

    // =========================================================================
    // CERTIFICATE
    // =========================================================================

    public static class CertificateRequest {
        public UUID recipientUserId;
        public String recipientName;
        public String certificateType;
        public UUID sportId;
        public Integer position;
        public String pdfUrl;
        public String teamName;
        public String sportName;
    }

    public static class CertificateResponse {
        public UUID id;
        public UUID eventId;
        public UUID recipientUserId;
        public String recipientName;
        public String certificateType;
        public UUID sportId;
        public String sportName;
        public String teamName;
        public Integer position;
        public String pdfUrl;
        public LocalDateTime issuedAt;
        public LocalDateTime createdAt;
    }
}
