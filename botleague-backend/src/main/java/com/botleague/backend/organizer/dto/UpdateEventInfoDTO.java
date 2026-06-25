package com.botleague.backend.organizer.dto;

import java.time.LocalDate;

/**
 * Fields an ORGANIZER is permitted to change on an event.
 *
 * Excluded (ADMINISTRATOR / SUPER_ADMIN only):
 *   - tier          — competitive classification, locked after approval
 *   - status        — lifecycle managed by admin via /admin/events/{id}/status
 *   - sport specs   — modified through EventSports endpoints (SUPER_ADMIN only)
 */
public class UpdateEventInfoDTO {

    // ── Descriptive ─────────────────────────────────────────────────────────
    private String eventName;
    private String eventDescription;
    private String eventLogoUrl;

    // ── Organisation ─────────────────────────────────────────────────────────
    private String organizationName;
    private String organizationUrl;

    // ── Venue / location ─────────────────────────────────────────────────────
    private String venueName;
    private String venueAddress;
    private String city;
    private String state;
    private String country;

    // ── Timeline ─────────────────────────────────────────────────────────────
    private LocalDate startDate;
    private LocalDate endDate;

    // ── Contact / logistics ──────────────────────────────────────────────────
    private String contactEmail;
    private String contactPhone;
    private String websiteUrl;
    private String notes;

    // ── Getters & Setters ────────────────────────────────────────────────────

    public String getEventName()                    { return eventName; }
    public void setEventName(String v)              { this.eventName = v; }

    public String getEventDescription()             { return eventDescription; }
    public void setEventDescription(String v)       { this.eventDescription = v; }

    public String getEventLogoUrl()                 { return eventLogoUrl; }
    public void setEventLogoUrl(String v)           { this.eventLogoUrl = v; }

    public String getOrganizationName()             { return organizationName; }
    public void setOrganizationName(String v)       { this.organizationName = v; }

    public String getOrganizationUrl()              { return organizationUrl; }
    public void setOrganizationUrl(String v)        { this.organizationUrl = v; }

    public String getVenueName()                    { return venueName; }
    public void setVenueName(String v)              { this.venueName = v; }

    public String getVenueAddress()                 { return venueAddress; }
    public void setVenueAddress(String v)           { this.venueAddress = v; }

    public String getCity()                         { return city; }
    public void setCity(String v)                   { this.city = v; }

    public String getState()                        { return state; }
    public void setState(String v)                  { this.state = v; }

    public String getCountry()                      { return country; }
    public void setCountry(String v)                { this.country = v; }

    public LocalDate getStartDate()                 { return startDate; }
    public void setStartDate(LocalDate v)           { this.startDate = v; }

    public LocalDate getEndDate()                   { return endDate; }
    public void setEndDate(LocalDate v)             { this.endDate = v; }

    public String getContactEmail()                 { return contactEmail; }
    public void setContactEmail(String v)           { this.contactEmail = v; }

    public String getContactPhone()                 { return contactPhone; }
    public void setContactPhone(String v)           { this.contactPhone = v; }

    public String getWebsiteUrl()                   { return websiteUrl; }
    public void setWebsiteUrl(String v)             { this.websiteUrl = v; }

    public String getNotes()                        { return notes; }
    public void setNotes(String v)                  { this.notes = v; }
}
