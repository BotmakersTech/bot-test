package com.botleague.backend.team.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.botleague.backend.auth.enums.AccountStatus;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;



public class TeamMemberResponseDTO {

    // =====================================
    // USER DATA
    // =====================================

    private UUID userId;
    

    private String botleagueId;

    private String username;

    private String firstName;

    private String lastName;



    private LocalDate dateOfBirth;

    private String profilePhotoUrl;

    private String country;

    private String state;

    private String city;

    private String address;

  
    // =====================================
    // MEMBERSHIP DATA
    // =====================================

    private UUID membershipId;

    private UUID teamId;

    private TeamRole teamRole;

    private TeamMembershipStatus membershipStatus;

    public UUID getUserId() {
		return userId;
	}

	public void setUserId(UUID userId) {
		this.userId = userId;
	}

	public String getBotleagueId() {
		return botleagueId;
	}

	public void setBotleagueId(String botleagueId) {
		this.botleagueId = botleagueId;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public LocalDate getDateOfBirth() {
		return dateOfBirth;
	}

	public void setDateOfBirth(LocalDate dateOfBirth) {
		this.dateOfBirth = dateOfBirth;
	}

	public String getProfilePhotoUrl() {
		return profilePhotoUrl;
	}

	public void setProfilePhotoUrl(String profilePhotoUrl) {
		this.profilePhotoUrl = profilePhotoUrl;
	}

	public String getCountry() {
		return country;
	}

	public void setCountry(String country) {
		this.country = country;
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
	}

	public UUID getMembershipId() {
		return membershipId;
	}

	public void setMembershipId(UUID membershipId) {
		this.membershipId = membershipId;
	}

	public UUID getTeamId() {
		return teamId;
	}

	public void setTeamId(UUID teamId) {
		this.teamId = teamId;
	}

	public TeamRole getTeamRole() {
		return teamRole;
	}

	public void setTeamRole(TeamRole teamRole) {
		this.teamRole = teamRole;
	}

	public TeamMembershipStatus getMembershipStatus() {
		return membershipStatus;
	}

	public void setMembershipStatus(TeamMembershipStatus membershipStatus) {
		this.membershipStatus = membershipStatus;
	}

	public LocalDateTime getJoinedAt() {
		return joinedAt;
	}

	public void setJoinedAt(LocalDateTime joinedAt) {
		this.joinedAt = joinedAt;
	}

	public LocalDateTime getLeftAt() {
		return leftAt;
	}

	public void setLeftAt(LocalDateTime leftAt) {
		this.leftAt = leftAt;
	}

	private LocalDateTime joinedAt;

    private LocalDateTime leftAt;

 
    
    
    
}