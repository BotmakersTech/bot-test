package com.botleague.backend.events.dto;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Create-sport request. NOTE: eventId has no @NotNull because the controller
 * sets it from the path AFTER @Valid runs.
 * Enum fields are String to avoid Jackson crashing on empty-string values.
 */
public class EventSportsRequestDTO {

    private UUID eventId;

    @NotBlank(message = "Sport is required")
    private String sport;

    private String competitionType;

    @NotNull(message = "AgeGroup is required")
    private String ageGroup;

    private String sportData; // description

    // ---- physical constraints (all optional, per sport) ----
    private String weightClass;
    private Double weightLimitKg;
    private Double maxLengthCm;
    private Double maxWidthCm;
    private Double maxHeightCm;
    private String controlType;
    private Integer maxBotsPerTeam;
    private Map<String, String> extraRules;

    // ---- config ----
    private Integer minTeamSize;
    private Integer maxTeamSize;
    private Integer maxTeams;

    private Double entryFee;
    private Double prizeMoney;

    private String formatType;

    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;

    // ---- getters & setters ----
    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getCompetitionType() { return competitionType; }
    public void setCompetitionType(String competitionType) { this.competitionType = competitionType; }

    public String getAgeGroup() { return ageGroup; }
    public void setAgeGroup(String ageGroup) { this.ageGroup = ageGroup; }

    public String getSportData() { return sportData; }
    public void setSportData(String sportData) { this.sportData = sportData; }

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
}
