package com.botleague.backend.admin.dto;

import java.time.LocalDate;

public class UpdateEventRequest {

    private String eventName;
    private String eventDescription;
    private String eventLogoUrl;
    private String organizationName;
    private String organizationUrl;
    private String venueName;
    private String venueAddress;
    private String city;
    private String state;
    private String country;
    private LocalDate startDate;
    private LocalDate endDate;

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
}
