package com.botleague.backend.team.dto;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GetTeamResponseDTO {

	private UUID id;
    private String teamCode;
    private String teamName;
    private String description;

    @JsonProperty("logoUrl")
    private String logo_Url;

	private String institutionName;
    private String city;
    private String state;
    private String country;
    private String status;

    
    public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}
	
	
    public String getLogo_Url() {
		return logo_Url;
	}

	public void setLogo_Url(String logo_Url) {
		this.logo_Url = logo_Url;
	}

	public String getTeamCode() {
        return teamCode;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
