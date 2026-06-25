// com/botleague/backend/dashboard/dto/SportDTO.java
package com.botleague.backend.dashboard.dto;

import java.util.List;
import java.util.UUID;

import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.events.enums.RegistrationStatus;

public class SportDTO {

    private UUID eventSportId;
    private String sport;
    private AgeCategory ageGroup;
    private String weightClass;
    private String formatType;
    private RegistrationStatus registrationStatus; // this team's registration status
    private List<MatchDTO> matches;
	public UUID getEventSportId() {
		return eventSportId;
	}
	public void setEventSportId(UUID eventSportId) {
		this.eventSportId = eventSportId;
	}
	public String getSport() {
		return sport;
	}
	public void setSport(String sport) {
		this.sport = sport;
	}
	public AgeCategory getAgeGroup() {
		return ageGroup;
	}
	public void setAgeGroup(AgeCategory ageGroup) {
		this.ageGroup = ageGroup;
	}
	public String getWeightClass() {
		return weightClass;
	}
	public void setWeightClass(String weightClass) {
		this.weightClass = weightClass;
	}
	public String getFormatType() {
		return formatType;
	}
	public void setFormatType(String formatType) {
		this.formatType = formatType;
	}
	public RegistrationStatus getRegistrationStatus() {
		return registrationStatus;
	}
	public void setRegistrationStatus(RegistrationStatus registrationStatus2) {
		this.registrationStatus = registrationStatus2;
	}
	public List<MatchDTO> getMatches() {
		return matches;
	}
	public void setMatches(List<MatchDTO> matches) {
		this.matches = matches;
	}
	

    // Getters & Setters ...
    
    
}