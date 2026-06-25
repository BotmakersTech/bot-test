
package com.botleague.backend.dashboard.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.botleague.backend.events.enums.EventStatus;

public class EventDTO {

    private UUID eventId;
    private String eventCode;
    private String eventName;
    private String logoURL;
    private String eventDescription;
    private String organizationName;
    private String venueName;
    private String city;
    private String state;
    private LocalDate startDate;
    private LocalDate endDate;
    private EventStatus eventStatus;

    // The specific sport category this user is registered under
    private SportDTO sport;

	public UUID getEventId() {
		return eventId;
	}

	public void setEventId(UUID eventId) {
		this.eventId = eventId;
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

	public EventStatus getEventStatus() {
		return eventStatus;
	}

	public void setEventStatus(EventStatus eventStatus2) {
		this.eventStatus = eventStatus2;
	}

	public SportDTO getSport() {
		return sport;
	}

	public void setSport(SportDTO sport) {
		this.sport = sport;
	}

	public String getLogoURL() {
		return logoURL;
	}

	public void setLogoURL(String logoURL) {
		this.logoURL = logoURL;
	}

	
	
    // Getters & Setters ...
    
    
}