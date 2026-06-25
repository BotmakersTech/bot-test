package com.botleague.backend.admin.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class AdminEventSportResponse {

    private UUID id;

    private String sport;

    private String sportsInfo;

    private String status;

    private String formatType;

    private String ageGroup;

    private String weightClass;

    private Double entryFee;

    private Integer maxTeams;

    private Integer minTeamSize;

    private Integer maxTeamSize;

    private Integer registeredTeamsCount;

    private Double prizeMoney;

    private LocalDate registrationStartDate;

    private LocalDate registrationEndDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
    
    private List<AdminRegisteredTeamResponse>
    registrations;

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}
	
	

	public List<AdminRegisteredTeamResponse> getRegistrations() {
		return registrations;
	}

	public void setRegistrations(List<AdminRegisteredTeamResponse> registrations) {
		this.registrations = registrations;
	}

	public String getSport() {
		return sport;
	}

	public void setSport(String sport) {
		this.sport = sport;
	}

	public String getSportsInfo() {
		return sportsInfo;
	}

	public void setSportsInfo(String sportsInfo) {
		this.sportsInfo = sportsInfo;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getFormatType() {
		return formatType;
	}

	public void setFormatType(String formatType) {
		this.formatType = formatType;
	}

	public String getAgeGroup() {
		return ageGroup;
	}

	public void setAgeGroup(String ageGroup) {
		this.ageGroup = ageGroup;
	}

	public String getWeightClass() {
		return weightClass;
	}

	public void setWeightClass(String weightClass) {
		this.weightClass = weightClass;
	}

	public Double getEntryFee() {
		return entryFee;
	}

	public void setEntryFee(Double double1) {
		this.entryFee = double1;
	}

	public Integer getMaxTeams() {
		return maxTeams;
	}

	public void setMaxTeams(Integer maxTeams) {
		this.maxTeams = maxTeams;
	}

	public Integer getMinTeamSize() {
		return minTeamSize;
	}

	public void setMinTeamSize(Integer minTeamSize) {
		this.minTeamSize = minTeamSize;
	}

	public Integer getMaxTeamSize() {
		return maxTeamSize;
	}

	public void setMaxTeamSize(Integer maxTeamSize) {
		this.maxTeamSize = maxTeamSize;
	}

	public Integer getRegisteredTeamsCount() {
		return registeredTeamsCount;
	}

	public void setRegisteredTeamsCount(Integer registeredTeamsCount) {
		this.registeredTeamsCount = registeredTeamsCount;
	}

	public Double getPrizeMoney() {
		return prizeMoney;
	}

	public void setPrizeMoney(Double double1) {
		this.prizeMoney = double1;
	}

	public LocalDate getRegistrationStartDate() {
		return registrationStartDate;
	}

	public void setRegistrationStartDate(LocalDate registrationStartDate) {
		this.registrationStartDate = registrationStartDate;
	}

	public LocalDate getRegistrationEndDate() {
		return registrationEndDate;
	}

	public void setRegistrationEndDate(LocalDate registrationEndDate) {
		this.registrationEndDate = registrationEndDate;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

    // getters setters
    
    
}