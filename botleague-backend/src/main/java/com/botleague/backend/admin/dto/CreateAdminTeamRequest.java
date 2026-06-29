package com.botleague.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class CreateAdminTeamRequest {

    @NotBlank private String teamName;
    private String institutionName;
    private String city;
    private String state;
    private String country;
    private String description;

    /** UUID of the user to become CAPTAIN. Must not already be in another team. */
    private UUID captainUserId;

    public String getTeamName()             { return teamName; }
    public void   setTeamName(String v)     { this.teamName = v; }
    public String getInstitutionName()      { return institutionName; }
    public void   setInstitutionName(String v){ this.institutionName = v; }
    public String getCity()                 { return city; }
    public void   setCity(String v)         { this.city = v; }
    public String getState()                { return state; }
    public void   setState(String v)        { this.state = v; }
    public String getCountry()              { return country; }
    public void   setCountry(String v)      { this.country = v; }
    public String getDescription()          { return description; }
    public void   setDescription(String v)  { this.description = v; }
    public UUID   getCaptainUserId()        { return captainUserId; }
    public void   setCaptainUserId(UUID v)  { this.captainUserId = v; }
}
