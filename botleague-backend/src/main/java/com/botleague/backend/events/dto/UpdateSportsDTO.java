package com.botleague.backend.events.dto;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Partial update. Every field is optional - only non-null, non-blank fields are applied.
 * eventId / sportId are set from the path by the controller.
 * Enum fields are kept as String so empty-string payloads don't crash Jackson.
 */
public class UpdateSportsDTO {

    private UUID eventId;
    private UUID sportId;

    private String sport;
    private String competitionType;

    // typo kept for backward compat; "sportData" is the canonical JSON key from the frontend
    @JsonProperty("sportData")
    private String sportsDescripction;

    private String ageGroup;

    // ---- physical constraints ----
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

    public UUID getSportId() { return sportId; }
    public void setSportId(UUID sportId) { this.sportId = sportId; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getCompetitionType() { return competitionType; }
    public void setCompetitionType(String competitionType) { this.competitionType = competitionType; }

    public String getSportsDescripction() { return sportsDescripction; }
    public void setSportsDescripction(String sportsDescripction) { this.sportsDescripction = sportsDescripction; }

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