package com.botleague.backend.dashboard.dto;

import com.botleague.backend.auth.enums.AccountType;

public class ProfileDTO {

    private String firstName;
    private String lastName;
    private String botLeagueId;
    private String location;
    private AccountType role;
    private String memberSince;
    private Integer rank;
    private Integer seasonPoints;

    // ✅ Constructor
    public ProfileDTO(String firstName,
    				  String lastName,
                      String botLeagueId,
                      String location,
                      AccountType accountType,
                      String memberSince,
                      Integer rank,
                      Integer seasonPoints) {

        this.firstName = firstName;
        this.lastName=lastName;
        this.botLeagueId = botLeagueId;
        this.location = location;
        this.role = accountType;
        this.memberSince = memberSince;
        this.rank = rank;
        this.seasonPoints = seasonPoints;
    }

    // ✅ Getters (needed for JSON response)
    public String getfirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getBotLeagueId() { return botLeagueId; }
    public String getLocation() { return location; }
    public AccountType getRole() { return role; }
    public String getMemberSince() { return memberSince; }
    public Integer getRank() { return rank; }
    public Integer getSeasonPoints() { return seasonPoints; }
}