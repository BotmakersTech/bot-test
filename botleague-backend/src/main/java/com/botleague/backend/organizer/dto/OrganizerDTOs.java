package com.botleague.backend.organizer.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

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
        public int totalSports;
        public int completedSports;
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
        @NotBlank(message = "arenaName is required")
        public String arenaName;
        @Min(value = 1, message = "capacity must be positive")
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
        @NotBlank(message = "name is required")
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
        public UUID userId;
        public String name;
        public String email;
        public String phone;
        public String dutyStation;
        public String shift;
        public String notes;
        public LocalDateTime checkedInAt;
        public LocalDateTime checkedOutAt;
        public String status;
        public LocalDateTime appliedAt;
        public LocalDateTime decidedAt;
        public LocalDateTime createdAt;
    }

    // =========================================================================
    // VOLUNTEER APPLICATION (self-service)
    // =========================================================================

    public static class VolunteerApplicationRequest {
        /** Optional preference — organiser assigns the final shift on approval. */
        public String shift;
        public String notes;
    }

    public static class VolunteerDecisionRequest {
        /** APPROVED | REJECTED */
        @NotBlank(message = "status is required")
        public String status;
        public String reason;
    }

    /** A volunteer's own assignment across one event — "my assignments" listing. */
    public static class VolunteerAssignmentResponse {
        public UUID id;
        public UUID eventId;
        public String eventName;
        public String eventCity;
        public java.time.LocalDate eventStartDate;
        public java.time.LocalDate eventEndDate;
        public String dutyStation;
        public String shift;
        public LocalDateTime checkedInAt;
        public LocalDateTime checkedOutAt;
        public String status;
        public LocalDateTime appliedAt;
        public LocalDateTime decidedAt;
    }

    // =========================================================================
    // JUDGE
    // =========================================================================

    public static class JudgeRequest {
        public UUID userId;
        @NotBlank(message = "name is required")
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
        public UUID userId;
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
        @NotBlank(message = "name is required")
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
        @NotBlank(message = "title is required")
        public String title;
        @NotBlank(message = "body is required")
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
        public String sportName;
        public java.util.List<UUID> targetTeamIds;
        public String attachmentUrl;
        public String attachmentFileType;
        public Boolean isPinned;
        public LocalDateTime sentAt;
        public LocalDateTime createdAt;
    }

    // =========================================================================
    // SUPPORT CONTACT
    // =========================================================================

    public static class SupportContactRequest {
        public UUID eventSportId; // null = event-wide contact
        @NotBlank(message = "name is required")
        public String name;
        public String email;
        public String phone;
        public String roleLabel;
        public Integer displayOrder;
    }

    public static class SupportContactResponse {
        public UUID id;
        public UUID eventId;
        public UUID eventSportId;
        public String name;
        public String email;
        public String phone;
        public String roleLabel;
        public Integer displayOrder;
    }

    // =========================================================================
    // INCIDENT
    // =========================================================================

    public static class IncidentRequest {
        @NotBlank(message = "title is required")
        public String title;
        @NotBlank(message = "description is required")
        public String description;
        public String severity;
        public String arenaName;
    }

    public static class IncidentUpdateRequest {
        @NotBlank(message = "status is required")
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
        @NotBlank(message = "recipientName is required")
        public String recipientName;
        @NotBlank(message = "certificateType is required")
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
