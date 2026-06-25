package com.botleague.backend.team.dto;

import jakarta.validation.constraints.NotBlank;

public class InviteTeamMemberRequestDTO {

    @NotBlank(message = "User ID is required")
    private String invitedUserId;

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
}