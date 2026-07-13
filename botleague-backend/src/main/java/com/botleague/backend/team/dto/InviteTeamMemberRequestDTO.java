package com.botleague.backend.team.dto;

import com.botleague.backend.team.enums.TeamRole;
import jakarta.validation.constraints.NotBlank;

public class InviteTeamMemberRequestDTO {

    @NotBlank(message = "User ID is required")
    private String invitedUserId;

    // Optional — the role the invitee should land as once they accept.
    // Falls back to MEMBER if not set.
    private TeamRole role;

    public InviteTeamMemberRequestDTO() {
    }

    public String getInvitedUserId() {
        return invitedUserId;
    }

    public void setInvitedUserId(
            String invitedUserId
    ) {
        this.invitedUserId = invitedUserId;
    }

    public TeamRole getRole() {
        return role;
    }

    public void setRole(TeamRole role) {
        this.role = role;
    }
}