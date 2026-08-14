package com.botleague.backend.catalog.dto;

import java.util.List;
import java.util.Map;

/** All fields optional — only non-null fields are applied (PATCH semantics). */
public class UpdateLeagueSportRequest {

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
}
