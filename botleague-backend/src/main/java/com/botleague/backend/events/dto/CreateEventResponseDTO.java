package com.botleague.backend.events.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class CreateEventResponseDTO {

    private UUID id;

    private String eventCode;

    private String eventName;

    private String eventDescription;

    private String eventLogoUrl;

    private String eventThumbnailUrl;

    private String teaserVideo1Url;

    private String teaserVideo2Url;

    private String organizationName;

    private String venueName;

    private String city;

    private String state;

    private String country;

    private LocalDate startDate;

    private LocalDate endDate;

    private String status;

    private LocalDateTime createdAt;

    private List<GetEventSportsDTO> sports;

    // Getters & Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEventCode() {
        return eventCode;
    }

    public void setEventCode(String eventCode) {
        this.eventCode = eventCode;
    }

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

    public String getEventThumbnailUrl() {
        return eventThumbnailUrl;
    }

    public void setEventThumbnailUrl(String eventThumbnailUrl) {
        this.eventThumbnailUrl = eventThumbnailUrl;
    }

    public String getTeaserVideo1Url() {
        return teaserVideo1Url;
    }

    public void setTeaserVideo1Url(String teaserVideo1Url) {
        this.teaserVideo1Url = teaserVideo1Url;
    }

    public String getTeaserVideo2Url() {
        return teaserVideo2Url;
    }

    public void setTeaserVideo2Url(String teaserVideo2Url) {
        this.teaserVideo2Url = teaserVideo2Url;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
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

    public void setStartDate(LocalDate localDate) {
        this.startDate = localDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate localDate) {
        this.endDate = localDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }


    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<GetEventSportsDTO> getSports() {
        return sports;
    }

    public void setSports(List<GetEventSportsDTO> sports) {
        this.sports = sports;
    }
}