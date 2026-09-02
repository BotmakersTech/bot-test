package com.botleague.backend.timetrial.dto;

import java.util.UUID;

public class RoundEntryResponseDTO {

    private UUID entryId;
    private UUID registrationId;
    private String robotName;
    private String teamName;
    private Long timeMillis;
    private Boolean dnf;
    private String status;
    private Integer rankInRound;
    private String notes;

    public UUID getEntryId() { return entryId; }
    public void setEntryId(UUID entryId) { this.entryId = entryId; }

    public UUID getRegistrationId() { return registrationId; }
    public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

    public String getRobotName() { return robotName; }
    public void setRobotName(String robotName) { this.robotName = robotName; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public Long getTimeMillis() { return timeMillis; }
    public void setTimeMillis(Long timeMillis) { this.timeMillis = timeMillis; }

    public Boolean getDnf() { return dnf; }
    public void setDnf(Boolean dnf) { this.dnf = dnf; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getRankInRound() { return rankInRound; }
    public void setRankInRound(Integer rankInRound) { this.rankInRound = rankInRound; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
