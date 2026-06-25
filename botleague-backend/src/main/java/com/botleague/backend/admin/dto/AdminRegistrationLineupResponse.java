package com.botleague.backend.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class AdminRegistrationLineupResponse {

    private UUID id;

    private UUID eventRegistrationId;

    private UUID teamMemberId;
    private String fullName;

    private String role;

    private Boolean isActive;

    private LocalDateTime createdAt;

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getEventRegistrationId() {
        return eventRegistrationId;
    }

    public void setEventRegistrationId(UUID eventRegistrationId) {
        this.eventRegistrationId = eventRegistrationId;
    }

    public UUID getTeamMemberId() {
        return teamMemberId;
    }

    public void setTeamMemberId(UUID teamMemberId) {
        this.teamMemberId = teamMemberId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}