package com.botleague.backend.profile.dto;

import java.util.List;
import java.util.UUID;

public class PublicProfileResponseDTO {

    // Basic Info
    private UUID userId;
    private String name;
    private String teamRole;
    private String profileImageUrl;

    // Current Team
    private String teamName;
    private String teamLogoUrl;

    // Player Stats
    private Integer tournamentsPlayed;
    private Integer matchesPlayed;
    private Integer wins;
    private Integer losses;
    private Double winRate;

    // Player History
    private List<PlayerHistoryDTO> playerHistory;

    // Nested DTO for history
    public static class PlayerHistoryDTO {

        private String tournamentName; // e.g., TechFest 2026
        private String teamName;
        private String role;
        private String tier;
        private Integer position;
        private String resultLabel; // Winner, Runner-up, etc.

        // Getters & Setters
        public String getTournamentName() { return tournamentName; }
        public void setTournamentName(String tournamentName) { this.tournamentName = tournamentName; }

        public String getTeamName() { return teamName; }
        public void setTeamName(String teamName) { this.teamName = teamName; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getTier() { return tier; }
        public void setTier(String tier) { this.tier = tier; }

        public Integer getPosition() { return position; }
        public void setPosition(Integer position) { this.position = position; }

        public String getResultLabel() { return resultLabel; }
        public void setResultLabel(String resultLabel) { this.resultLabel = resultLabel; }
    }

    // Getters & Setters

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTeamRole() { return teamRole; }
    public void setTeamRole(String primaryRole) { this.teamRole = primaryRole; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getTeamLogoUrl() { return teamLogoUrl; }
    public void setTeamLogoUrl(String teamLogoUrl) { this.teamLogoUrl = teamLogoUrl; }

    public Integer getTournamentsPlayed() { return tournamentsPlayed; }
    public void setTournamentsPlayed(Integer tournamentsPlayed) { this.tournamentsPlayed = tournamentsPlayed; }

    public Integer getMatchesPlayed() { return matchesPlayed; }
    public void setMatchesPlayed(Integer matchesPlayed) { this.matchesPlayed = matchesPlayed; }

    public Integer getWins() { return wins; }
    public void setWins(Integer wins) { this.wins = wins; }

    public Integer getLosses() { return losses; }
    public void setLosses(Integer losses) { this.losses = losses; }

    public Double getWinRate() { return winRate; }
    public void setWinRate(Double winRate) { this.winRate = winRate; }

    public List<PlayerHistoryDTO> getPlayerHistory() { return playerHistory; }
    public void setPlayerHistory(List<PlayerHistoryDTO> playerHistory) { this.playerHistory = playerHistory; }
}