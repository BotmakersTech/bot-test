package com.botleague.backend.ranking.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class RankingResponse {

    private int rank;            // computed position (1-based) in the returned list
    private UUID id;
    private String entityType;
    private UUID teamId;
    private UUID userId;
    private String displayName;
    private String avatarUrl;
    private String state;
    private String city;
    private String category;
    private String categoryLabel;
    private String sport;
    private String scope;
    private UUID eventId;
    private String season;
    private int totalPoints;
    private int eventsPlayed;
    private int wins;
    private int losses;
    private int draws;
    private int goldMedals;
    private int silverMedals;
    private int bronzeMedals;
    private LocalDateTime lastUpdated;

    // ── getters / setters ────────────────────────────────────

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public UUID getTeamId() { return teamId; }
    public void setTeamId(UUID teamId) { this.teamId = teamId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

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

    public String getCategoryLabel() { return categoryLabel; }
    public void setCategoryLabel(String categoryLabel) { this.categoryLabel = categoryLabel; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }

    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

    public int getEventsPlayed() { return eventsPlayed; }
    public void setEventsPlayed(int eventsPlayed) { this.eventsPlayed = eventsPlayed; }

    public int getWins() { return wins; }
    public void setWins(int wins) { this.wins = wins; }

    public int getLosses() { return losses; }
    public void setLosses(int losses) { this.losses = losses; }

    public int getDraws() { return draws; }
    public void setDraws(int draws) { this.draws = draws; }

    public int getGoldMedals() { return goldMedals; }
    public void setGoldMedals(int goldMedals) { this.goldMedals = goldMedals; }

    public int getSilverMedals() { return silverMedals; }
    public void setSilverMedals(int silverMedals) { this.silverMedals = silverMedals; }

    public int getBronzeMedals() { return bronzeMedals; }
    public void setBronzeMedals(int bronzeMedals) { this.bronzeMedals = bronzeMedals; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
