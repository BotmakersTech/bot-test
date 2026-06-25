package com.botleague.backend.team.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdateTeamRequestDTO {

    private String teamName;
    private String description;
    private String institutionName;

    @JsonProperty("logoUrl")
    private String logo_Url;
    private String city;
    private String state;
    private String country;
	public String getTeamName() {
		return teamName;
	}
	
	
	public String getLogo_Url() {
		return logo_Url;
	}


	public void setLogo_Url(String logo_Url) {
		this.logo_Url = logo_Url;
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

}