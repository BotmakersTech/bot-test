package com.botleague.backend.timetrial.dto;

import java.util.List;
import java.util.UUID;

public class RoundResponseDTO {

    private UUID roundId;
    private UUID eventSportId;
    private Integer roundNumber;
    private String status;
    private Integer cutoffCount;
    private Integer actualAdvancedCount;
    private List<RoundEntryResponseDTO> entries;

    public UUID getRoundId() { return roundId; }
    public void setRoundId(UUID roundId) { this.roundId = roundId; }

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public Integer getRoundNumber() { return roundNumber; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getCutoffCount() { return cutoffCount; }
    public void setCutoffCount(Integer cutoffCount) { this.cutoffCount = cutoffCount; }

    public Integer getActualAdvancedCount() { return actualAdvancedCount; }
    public void setActualAdvancedCount(Integer actualAdvancedCount) { this.actualAdvancedCount = actualAdvancedCount; }

    public List<RoundEntryResponseDTO> getEntries() { return entries; }
    public void setEntries(List<RoundEntryResponseDTO> entries) { this.entries = entries; }
}
