package com.botleague.backend.admin.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.botleague.backend.events.dto.PrizePositionDTO;

public class AdminEventSportResponse {

    private UUID id;

    private String sport;

    private String sportsInfo;

    private String sportThumbnailUrl;

    private String sportTeaserVideoUrl;

    private String status;

    private String formatType;

    private String ageGroup;

    private String weightClass;

    private java.math.BigDecimal entryFee;

    private Integer maxTeams;

    private Integer minTeamSize;

    private Integer maxTeamSize;

    private Integer registeredTeamsCount;

    private java.math.BigDecimal prizeMoney;

    private java.util.List<PrizePositionDTO> prizeDistribution;

    private String mapUrl;

    private LocalDate registrationStartDate;

    private LocalDate registrationEndDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private boolean bracketGenerated;

    private List<AdminRegisteredTeamResponse> registrations;

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

	public String getSportThumbnailUrl() {
		return sportThumbnailUrl;
	}

	public void setSportThumbnailUrl(String sportThumbnailUrl) {
		this.sportThumbnailUrl = sportThumbnailUrl;
	}

	public String getSportTeaserVideoUrl() {
		return sportTeaserVideoUrl;
	}

	public void setSportTeaserVideoUrl(String sportTeaserVideoUrl) {
		this.sportTeaserVideoUrl = sportTeaserVideoUrl;
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

	public java.math.BigDecimal getEntryFee() {
		return entryFee;
	}

	public void setEntryFee(java.math.BigDecimal entryFee) {
		this.entryFee = entryFee;
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

	public java.math.BigDecimal getPrizeMoney() {
		return prizeMoney;
	}

	public void setPrizeMoney(java.math.BigDecimal prizeMoney) {
		this.prizeMoney = prizeMoney;
	}

	public java.util.List<PrizePositionDTO> getPrizeDistribution() {
		return prizeDistribution;
	}

	public void setPrizeDistribution(java.util.List<PrizePositionDTO> prizeDistribution) {
		this.prizeDistribution = prizeDistribution;
	}

	public String getMapUrl() {
		return mapUrl;
	}

	public void setMapUrl(String mapUrl) {
		this.mapUrl = mapUrl;
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

	public boolean isBracketGenerated() {
		return bracketGenerated;
	}

	public void setBracketGenerated(boolean bracketGenerated) {
		this.bracketGenerated = bracketGenerated;
	}
}