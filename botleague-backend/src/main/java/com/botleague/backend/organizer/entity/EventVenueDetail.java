package com.botleague.backend.organizer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "event_venue_details", indexes = {
    @Index(name = "idx_venue_detail_event", columnList = "event_id", unique = true)
})
public class EventVenueDetail {

    @Id
    private UUID id;

    @Column(name = "event_id", nullable = false, unique = true)
    private UUID eventId;

    @Column(name = "floor_plan_url", columnDefinition = "TEXT")
    private String floorPlanUrl;

    @Column(name = "arena_count")
    private Integer arenaCount;

    @Column(name = "seating_capacity")
    private Integer seatingCapacity;

    @Column(name = "has_power", nullable = false)
    private Boolean hasPower = false;

    @Column(name = "has_internet", nullable = false)
    private Boolean hasInternet = false;

    @Column(name = "has_medical_facility", nullable = false)
    private Boolean hasMedicalFacility = false;

    @Column(name = "parking_capacity")
    private Integer parkingCapacity;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    @Column(name = "safety_compliant", nullable = false)
    private Boolean safetyCompliant = false;

    /** JSON string: [{"item":"Setup tables","done":true}, ...] */
    @Column(name = "checklist_json", columnDefinition = "TEXT")
    private String checklistJson;

    @Column(name = "additional_notes", columnDefinition = "TEXT")
    private String additionalNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
    public String getFloorPlanUrl() { return floorPlanUrl; }
    public void setFloorPlanUrl(String floorPlanUrl) { this.floorPlanUrl = floorPlanUrl; }
    public Integer getArenaCount() { return arenaCount; }
    public void setArenaCount(Integer arenaCount) { this.arenaCount = arenaCount; }
    public Integer getSeatingCapacity() { return seatingCapacity; }
    public void setSeatingCapacity(Integer seatingCapacity) { this.seatingCapacity = seatingCapacity; }
    public Boolean getHasPower() { return hasPower; }
    public void setHasPower(Boolean hasPower) { this.hasPower = hasPower; }
    public Boolean getHasInternet() { return hasInternet; }
    public void setHasInternet(Boolean hasInternet) { this.hasInternet = hasInternet; }
    public Boolean getHasMedicalFacility() { return hasMedicalFacility; }
    public void setHasMedicalFacility(Boolean hasMedicalFacility) { this.hasMedicalFacility = hasMedicalFacility; }
    public Integer getParkingCapacity() { return parkingCapacity; }
    public void setParkingCapacity(Integer parkingCapacity) { this.parkingCapacity = parkingCapacity; }
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
    public Boolean getSafetyCompliant() { return safetyCompliant; }
    public void setSafetyCompliant(Boolean safetyCompliant) { this.safetyCompliant = safetyCompliant; }
    public String getChecklistJson() { return checklistJson; }
    public void setChecklistJson(String checklistJson) { this.checklistJson = checklistJson; }
    public String getAdditionalNotes() { return additionalNotes; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
