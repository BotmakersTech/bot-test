package com.botleague.backend.events.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public class GetEventSportsDTO {

    private UUID id;
    private UUID eventId;

    private String sport;
    private String competitionType;   // enum name
    private String sportsDescription;
    private String ageGroup;          // enum name

    // ---- physical constraints ----
    private String weightClass;
    private Double weightLimitKg;
    private Double maxLengthCm;
    private Double maxWidthCm;
    private Double maxHeightCm;
    private String controlType;       // enum name
    private Integer maxBotsPerTeam;
    private Map<String, String> extraRules;

    // ---- config ----
    private Integer minTeamSize;
    private Integer maxTeamSize;
    private Integer maxTeams;
    private Integer registeredTeamsCount;

    private Double entryFee;
    private Double prizeMoney;

    private String formatType;

    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;

    private String status;            // enum name
    private boolean bracketGenerated;
    private String rejectionReason;
    private LocalDateTime createdAt;

    // ---- getters & setters ----
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getCompetitionType() { return competitionType; }
    public void setCompetitionType(String competitionType) { this.competitionType = competitionType; }

    public String getSportsDescription() { return sportsDescription; }
    public void setSportsDescription(String sportsDescription) { this.sportsDescription = sportsDescription; }

    public String getAgeGroup() { return ageGroup; }
    public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }

    public String getWeightClass() { return weightClass; }
    public void setWeightClass(String weightClass) { this.weightClass = weightClass; }

    public Double getWeightLimitKg() { return weightLimitKg; }
    public void setWeightLimitKg(Double weightLimitKg) { this.weightLimitKg = weightLimitKg; }

    public Double getMaxLengthCm() { return maxLengthCm; }
    public void setMaxLengthCm(Double maxLengthCm) { this.maxLengthCm = maxLengthCm; }

    public Double getMaxWidthCm() { return maxWidthCm; }
    public void setMaxWidthCm(Double maxWidthCm) { this.maxWidthCm = maxWidthCm; }

    public Double getMaxHeightCm() { return maxHeightCm; }
    public void setMaxHeightCm(Double maxHeightCm) { this.maxHeightCm = maxHeightCm; }

    public String getControlType() { return controlType; }
    public void setControlType(String controlType) { this.controlType = controlType; }

    public Integer getMaxBotsPerTeam() { return maxBotsPerTeam; }
    public void setMaxBotsPerTeam(Integer maxBotsPerTeam) { this.maxBotsPerTeam = maxBotsPerTeam; }

    public Map<String, String> getExtraRules() { return extraRules; }
    public void setExtraRules(Map<String, String> extraRules) { this.extraRules = extraRules; }

    public Integer getMinTeamSize() { return minTeamSize; }
    public void setMinTeamSize(Integer minTeamSize) { this.minTeamSize = minTeamSize; }

    public Integer getMaxTeamSize() { return maxTeamSize; }
    public void setMaxTeamSize(Integer maxTeamSize) { this.maxTeamSize = maxTeamSize; }

    public Integer getMaxTeams() { return maxTeams; }
    public void setMaxTeams(Integer maxTeams) { this.maxTeams = maxTeams; }

    public Integer getRegisteredTeamsCount() { return registeredTeamsCount; }
    public void setRegisteredTeamsCount(Integer registeredTeamsCount) { this.registeredTeamsCount = registeredTeamsCount; }

    public Double getEntryFee() { return entryFee; }
    public void setEntryFee(Double entryFee) { this.entryFee = entryFee; }

    public Double getPrizeMoney() { return prizeMoney; }
    public void setPrizeMoney(Double prizeMoney) { this.prizeMoney = prizeMoney; }

    public String getFormatType() { return formatType; }
    public void setFormatType(String formatType) { this.formatType = formatType; }

    public LocalDate getRegistrationStartDate() { return registrationStartDate; }
    public void setRegistrationStartDate(LocalDate registrationStartDate) { this.registrationStartDate = registrationStartDate; }

    public LocalDate getRegistrationEndDate() { return registrationEndDate; }
    public void setRegistrationEndDate(LocalDate registrationEndDate) { this.registrationEndDate = registrationEndDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isBracketGenerated() { return bracketGenerated; }
    public void setBracketGenerated(boolean bracketGenerated) { this.bracketGenerated = bracketGenerated; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}