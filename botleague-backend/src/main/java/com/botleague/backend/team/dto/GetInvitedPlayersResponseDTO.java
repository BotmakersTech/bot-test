package com.botleague.backend.team.dto;

import java.util.List;

public class GetInvitedPlayersResponseDTO {

    private List<TeamMemberResponseDTO> invitedPlayers;

    public GetInvitedPlayersResponseDTO() {
    }

    public List<TeamMemberResponseDTO> getInvitedPlayers() {
        return invitedPlayers;
    }

    public void setInvitedPlayers(
            List<TeamMemberResponseDTO> invitedPlayers
    ) {
        this.invitedPlayers = invitedPlayers;
    }
}