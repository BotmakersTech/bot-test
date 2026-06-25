package com.botleague.backend.admin.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class UserSummaryResponse {

    private UUID id;
    private String botleagueId;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String accountStatus;
    private String primaryRole;          // highest-privilege role
    private List<String> allRoles;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    // extended profile fields (populated on detail view)
    private String gender;
    private LocalDate dateOfBirth;
    private String city;
    private String state;
    private String country;
    private String address;
    private String profilePhotoUrl;

    // event/sport assignments (populated on detail view)
    private List<AssignedEventDTO> assignedEvents;
    private List<AssignedSportDTO> assignedSports;

    // ── nested DTOs ──────────────────────────────────

    public static class AssignedEventDTO {
        private UUID eventId;
        private String eventCode;
        private String eventName;
        private LocalDateTime assignedAt;

        public UUID getEventId() { return eventId; }
        public void setEventId(UUID eventId) { this.eventId = eventId; }
        public String getEventCode() { return eventCode; }
        public void setEventCode(String eventCode) { this.eventCode = eventCode; }
        public String getEventName() { return eventName; }
        public void setEventName(String eventName) { this.eventName = eventName; }
        public LocalDateTime getAssignedAt() { return assignedAt; }
        public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
    }

    public static class AssignedSportDTO {
        private UUID eventSportId;
        private UUID eventId;
        private String eventName;
        private String sport;
        private LocalDateTime assignedAt;

        public UUID getEventSportId() { return eventSportId; }
        public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }
        public UUID getEventId() { return eventId; }
        public void setEventId(UUID eventId) { this.eventId = eventId; }
        public String getEventName() { return eventName; }
        public void setEventName(String eventName) { this.eventName = eventName; }
        public String getSport() { return sport; }
        public void setSport(String sport) { this.sport = sport; }
        public LocalDateTime getAssignedAt() { return assignedAt; }
        public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
    }

    // ── getters/setters ──────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getBotleagueId() { return botleagueId; }
    public void setBotleagueId(String botleagueId) { this.botleagueId = botleagueId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }
    public String getPrimaryRole() { return primaryRole; }
    public void setPrimaryRole(String primaryRole) { this.primaryRole = primaryRole; }
    public List<String> getAllRoles() { return allRoles; }
    public void setAllRoles(List<String> allRoles) { this.allRoles = allRoles; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public List<AssignedEventDTO> getAssignedEvents() { return assignedEvents; }
    public void setAssignedEvents(List<AssignedEventDTO> assignedEvents) { this.assignedEvents = assignedEvents; }
    public List<AssignedSportDTO> getAssignedSports() { return assignedSports; }
    public void setAssignedSports(List<AssignedSportDTO> assignedSports) { this.assignedSports = assignedSports; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }
}
