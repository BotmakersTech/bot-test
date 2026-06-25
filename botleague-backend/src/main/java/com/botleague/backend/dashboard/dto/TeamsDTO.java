package com.botleague.backend.dashboard.dto;

import java.util.UUID;

import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;

public class TeamsDTO {

	private UUID teamId;
	
	private String teamName;
	private String teamCode;
	private String teamLogo;
	private TeamRole role;
	private TeamMembershipStatus status;
	
//	public TeamsDTO(UUID teamId,
//			String teamName,
//			String teamCode,
//			String role,
//			String status) {
//		this.teamId=teamId;
//		this.teamName=teamName;
//		this.teamCode=teamCode;
//		this.role=role;
//		this.status=status;
//		
//	}
//	
	
	public UUID getTeamId() {
		return teamId;
	}
	public String getTeamLogo() {
		return teamLogo;
	}
	public void setTeamLogo(String teamLogo) {
		this.teamLogo = teamLogo;
	}
	public void setTeamId(UUID teamId) {
		this.teamId = teamId;
	}
	public String getTeamName() {
		return teamName;
	}
	public void setTeamName(String teamName) {
		this.teamName = teamName;
	}
	public String getTeamCode() {
		return teamCode;
	}
	public void setTeamCode(String teamCode) {
		this.teamCode = teamCode;
	}
	public TeamRole getRole() {
		return role;
	}
	public void setRole(TeamRole role) {
		this.role = role;
	}
	public TeamMembershipStatus getStatus() {
		return status;
	}
	public void setStatus(TeamMembershipStatus status) {
		this.status = status;
	}
}
