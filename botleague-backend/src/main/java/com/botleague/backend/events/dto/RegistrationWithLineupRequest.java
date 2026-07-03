package com.botleague.backend.events.dto;

import java.util.List;
import java.util.UUID;

import com.botleague.backend.events.enums.LineupRole;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RegistrationWithLineupRequest {

    @NotNull(message = "Event sport ID is required")
    private UUID eventSportId;

    @NotNull(message = "Team ID is required")
    private UUID teamId;

    @NotNull(message = "Robot ID is required")
    private UUID botId;

    /** The authenticated user triggering the registration (set by controller). */
    private UUID callerId;

    @NotNull(message = "Lineup is required")
    @Size(min = 1, message = "At least one lineup member is required")
    private List<LineupEntry> lineup;

    // =====================================================
    // INNER CLASS
    // =====================================================

    public static class LineupEntry {

        @NotNull(message = "Team membership ID is required")
        private UUID teamMembershipId;

        @NotNull(message = "Lineup role is required")
        private LineupRole lineupRole;

        public UUID getTeamMembershipId() { return teamMembershipId; }
        public void setTeamMembershipId(UUID teamMembershipId) { this.teamMembershipId = teamMembershipId; }

        public LineupRole getLineupRole() { return lineupRole; }
        public void setLineupRole(LineupRole lineupRole) { this.lineupRole = lineupRole; }
    }

    // =====================================================
    // GETTERS & SETTERS
    // =====================================================

    public UUID getEventSportId() { return eventSportId; }
    public void setEventSportId(UUID eventSportId) { this.eventSportId = eventSportId; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public UUID getBotId() { return botId; }
    public void setBotId(UUID botId) { this.botId = botId; }

    public UUID getCallerId() { return callerId; }
    public void setCallerId(UUID callerId) { this.callerId = callerId; }

    public List<LineupEntry> getLineup() { return lineup; }
    public void setLineup(List<LineupEntry> lineup) { this.lineup = lineup; }
}
