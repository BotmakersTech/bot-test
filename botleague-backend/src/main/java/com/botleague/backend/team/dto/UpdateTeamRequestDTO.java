package com.botleague.backend.team.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

public class UpdateTeamRequestDTO {

    @Size(max = 100, message = "Team name must be at most 100 characters")
    private String teamName;

    @Size(max = 2000, message = "Description must be at most 2000 characters")
    private String description;

    @Size(max = 150, message = "Institution name must be at most 150 characters")
    private String institutionName;

    @JsonProperty("logoUrl")
    @Size(max = 500, message = "Logo URL must be at most 500 characters")
    private String logo_Url;

    @Size(max = 100, message = "City must be at most 100 characters")
    private String city;

    @Size(max = 100, message = "State must be at most 100 characters")
    private String state;

    @Size(max = 100, message = "Country must be at most 100 characters")
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