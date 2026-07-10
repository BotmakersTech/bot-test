package com.botleague.backend.events.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class CreateEventRequestDTO {

    // =========================
    // Identity
    // =========================
    @NotBlank(message = "Event name is required")
    private String eventName;

    private String eventDescription;

    private String eventLogoUrl;

    // =========================
    // Organizer Info
    // =========================
    private String organizationName;

    private String organizationUrl;

    // =========================
    // Location
    // =========================
    private String venueName;

    private String venueAddress;

    private String city;

    private String state;

    private String country;

    // =========================
    // Timeline
    // =========================
    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDate registrationDeadline;

    // =========================
    // Participation
    // =========================
    @Positive(message = "Max teams must be greater than 0")
    private Integer maxTeams;

    // =========================
    // Requirements
    // =========================
    private Boolean requiresArena;

    private Boolean requiresGroundSupport;

    private String notes;

    // =========================
    // Getters & Setters
    // =========================

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public String getEventDescription() {
        return eventDescription;
    }

    public void setEventDescription(String eventDescription) {
        this.eventDescription = eventDescription;
    }

    public String getEventLogoUrl() {
        return eventLogoUrl;
    }

    public void setEventLogoUrl(String eventLogoUrl) {
        this.eventLogoUrl = eventLogoUrl;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getOrganizationUrl() {
        return organizationUrl;
    }

    public void setOrganizationUrl(String organizationUrl) {
        this.organizationUrl = organizationUrl;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public String getVenueAddress() {
        return venueAddress;
    }

    public void setVenueAddress(String venueAddress) {
        this.venueAddress = venueAddress;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getRegistrationDeadline() {
        return registrationDeadline;
    }

    public void setRegistrationDeadline(LocalDate registrationDeadline) {
        this.registrationDeadline = registrationDeadline;
    }

    public Integer getMaxTeams() {
        return maxTeams;
    }

    public void setMaxTeams(Integer maxTeams) {
        this.maxTeams = maxTeams;
    }

    public Boolean getRequiresArena() {
        return requiresArena;
    }

    public void setRequiresArena(Boolean requiresArena) {
        this.requiresArena = requiresArena;
    }

    public Boolean getRequiresGroundSupport() {
        return requiresGroundSupport;
    }

    public void setRequiresGroundSupport(Boolean requiresGroundSupport) {
        this.requiresGroundSupport = requiresGroundSupport;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}