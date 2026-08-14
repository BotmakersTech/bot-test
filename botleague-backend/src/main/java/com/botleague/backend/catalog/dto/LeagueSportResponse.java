package com.botleague.backend.catalog.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class LeagueSportResponse {

    private UUID id;
    private UUID leagueId;
    private String leagueSlug;
    private String leagueName;
    private UUID sportId;
    private String sportSlug;
    private String sportName;
    private Double weightLimitKg;
    private Double maxLengthCm;
    private Double maxWidthCm;
    private Double maxHeightCm;
    private String controlType;
    private Integer maxBotsPerTeam;
    private List<WeightClassDTO> weightClasses;
    private Map<String, String> extraSpecs;
    private String entryNote;
    private String status;
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getLeagueId() { return leagueId; }
    public void setLeagueId(UUID leagueId) { this.leagueId = leagueId; }

    public String getLeagueSlug() { return leagueSlug; }
    public void setLeagueSlug(String leagueSlug) { this.leagueSlug = leagueSlug; }

    public String getLeagueName() { return leagueName; }
    public void setLeagueName(String leagueName) { this.leagueName = leagueName; }

    public UUID getSportId() { return sportId; }
    public void setSportId(UUID sportId) { this.sportId = sportId; }

    public String getSportSlug() { return sportSlug; }
    public void setSportSlug(String sportSlug) { this.sportSlug = sportSlug; }

    public String getSportName() { return sportName; }
    public void setSportName(String sportName) { this.sportName = sportName; }

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

    public List<WeightClassDTO> getWeightClasses() { return weightClasses; }
    public void setWeightClasses(List<WeightClassDTO> weightClasses) { this.weightClasses = weightClasses; }

    public Map<String, String> getExtraSpecs() { return extraSpecs; }
    public void setExtraSpecs(Map<String, String> extraSpecs) { this.extraSpecs = extraSpecs; }

    public String getEntryNote() { return entryNote; }
    public void setEntryNote(String entryNote) { this.entryNote = entryNote; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
