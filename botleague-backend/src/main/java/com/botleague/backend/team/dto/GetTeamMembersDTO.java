package com.botleague.backend.team.dto;

import java.util.List;

public class GetTeamMembersDTO {

    private String teamCode;
    private String teamName;
    private String logo_Url;
    private List<TeamMemberResponseDTO> members;
	public String getTeamCode() {
		return teamCode;
	}
	
	public String getLogo_Url() {
		return logo_Url;
	}

	public void setLogo_Url(String logo_Url) {
		this.logo_Url = logo_Url;
	}

	public void setTeamCode(String teamCode) {
		this.teamCode = teamCode;
	}
	public String getTeamName() {
		return teamName;
	}
	public void setTeamName(String teamName) {
		this.teamName = teamName;
	}
	public List<TeamMemberResponseDTO> getMembers() {
		return members;
	}
	public void setMembers(List<TeamMemberResponseDTO> members) {
		this.members = members;
	}
    
    

}