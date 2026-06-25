package com.botleague.backend.ranking.dto;

/** Admin-only DTO for creating or updating a ranking entry. */
public class RankingUpdateRequest {

    private String entityType;    // "TEAM" or "USER"
    private String teamId;
    private String userId;
    private String displayName;
    private String avatarUrl;
    private String state;
    private String city;
    private String category;      // AgeCategory name
    private String sport;
    private String scope;         // "NATIONAL" | "STATE" | "EVENT"
    private String eventId;
    private String season;
    private Integer totalPoints;
    private Integer eventsPlayed;
    private Integer wins;
    private Integer losses;
    private Integer draws;
    private Integer goldMedals;
    private Integer silverMedals;
    private Integer bronzeMedals;

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }

    public Integer getTotalPoints() { return totalPoints; }
    public void setTotalPoints(Integer totalPoints) { this.totalPoints = totalPoints; }

    public Integer getEventsPlayed() { return eventsPlayed; }
    public void setEventsPlayed(Integer eventsPlayed) { this.eventsPlayed = eventsPlayed; }

    public Integer getWins() { return wins; }
    public void setWins(Integer wins) { this.wins = wins; }

    public Integer getLosses() { return losses; }
    public void setLosses(Integer losses) { this.losses = losses; }

    public Integer getDraws() { return draws; }
    public void setDraws(Integer draws) { this.draws = draws; }

    public Integer getGoldMedals() { return goldMedals; }
    public void setGoldMedals(Integer goldMedals) { this.goldMedals = goldMedals; }

    public Integer getSilverMedals() { return silverMedals; }
    public void setSilverMedals(Integer silverMedals) { this.silverMedals = silverMedals; }

    public Integer getBronzeMedals() { return bronzeMedals; }
    public void setBronzeMedals(Integer bronzeMedals) { this.bronzeMedals = bronzeMedals; }
}
