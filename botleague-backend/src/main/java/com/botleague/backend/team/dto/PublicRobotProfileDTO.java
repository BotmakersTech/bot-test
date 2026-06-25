package com.botleague.backend.team.dto;

import java.util.List;
import java.util.UUID;

public class PublicRobotProfileDTO {

    // ── Identity ─────────────────────────────────────────────────────────────
    private UUID   robotId;
    private String robotCode;
    private String robotName;
    private String description;
    private String status;
    private String imageUrl;      // first image from robot_media

    // ── Specs ─────────────────────────────────────────────────────────────────
    private String robotType;     // RobotCategory enum name
    private String sport;
    private String ageCategory;
    private String controlType;
    private String controlMode;
    private String weightClass;
    private Double weightKg;
    private Double lengthCm;
    private Double widthCm;
    private Double heightCm;

    // ── Team ─────────────────────────────────────────────────────────────────
    private UUID   teamId;
    private String teamName;
    private String teamCode;
    private String teamLogoUrl;

    // ── Career aggregates ────────────────────────────────────────────────────
    private int     totalMatches;
    private int     totalWins;
    private int     totalLosses;
    private int     totalPoints;
    private int     eventsPlayed;
    private int     goldMedals;
    private int     silverMedals;
    private int     bronzeMedals;

    // ── Per-event tournament records ──────────────────────────────────────────
    private List<TournamentRecord> records;

    public static class TournamentRecord {
        private UUID    eventId;
        private String  eventName;
        private UUID    eventSportId;
        private String  sport;
        private String  ageGroup;
        private String  weightClass;
        private Integer eventRank;
        private int     matchesPlayed;
        private int     wins;
        private int     losses;
        private int     pointsEarned;
        private boolean isFinalized;

        public UUID    getEventId()              { return eventId; }
        public void    setEventId(UUID v)        { this.eventId = v; }
        public String  getEventName()            { return eventName; }
        public void    setEventName(String v)    { this.eventName = v; }
        public UUID    getEventSportId()         { return eventSportId; }
        public void    setEventSportId(UUID v)   { this.eventSportId = v; }
        public String  getSport()                { return sport; }
        public void    setSport(String v)        { this.sport = v; }
        public String  getAgeGroup()             { return ageGroup; }
        public void    setAgeGroup(String v)     { this.ageGroup = v; }
        public String  getWeightClass()          { return weightClass; }
        public void    setWeightClass(String v)  { this.weightClass = v; }
        public Integer getEventRank()            { return eventRank; }
        public void    setEventRank(Integer v)   { this.eventRank = v; }
        public int     getMatchesPlayed()        { return matchesPlayed; }
        public void    setMatchesPlayed(int v)   { this.matchesPlayed = v; }
        public int     getWins()                 { return wins; }
        public void    setWins(int v)            { this.wins = v; }
        public int     getLosses()               { return losses; }
        public void    setLosses(int v)          { this.losses = v; }
        public int     getPointsEarned()         { return pointsEarned; }
        public void    setPointsEarned(int v)    { this.pointsEarned = v; }
        public boolean isFinalized()             { return isFinalized; }
        public void    setFinalized(boolean v)   { this.isFinalized = v; }
    }

    // ── Getters & Setters ────────────────────────────────────────────────────
    public UUID   getRobotId()              { return robotId; }
    public void   setRobotId(UUID v)        { this.robotId = v; }
    public String getRobotCode()            { return robotCode; }
    public void   setRobotCode(String v)    { this.robotCode = v; }
    public String getRobotName()            { return robotName; }
    public void   setRobotName(String v)    { this.robotName = v; }
    public String getDescription()          { return description; }
    public void   setDescription(String v)  { this.description = v; }
    public String getStatus()               { return status; }
    public void   setStatus(String v)       { this.status = v; }
    public String getImageUrl()             { return imageUrl; }
    public void   setImageUrl(String v)     { this.imageUrl = v; }
    public String getRobotType()            { return robotType; }
    public void   setRobotType(String v)    { this.robotType = v; }
    public String getSport()                { return sport; }
    public void   setSport(String v)        { this.sport = v; }
    public String getAgeCategory()          { return ageCategory; }
    public void   setAgeCategory(String v)  { this.ageCategory = v; }
    public String getControlType()          { return controlType; }
    public void   setControlType(String v)  { this.controlType = v; }
    public String getControlMode()          { return controlMode; }
    public void   setControlMode(String v)  { this.controlMode = v; }
    public String getWeightClass()          { return weightClass; }
    public void   setWeightClass(String v)  { this.weightClass = v; }
    public Double getWeightKg()             { return weightKg; }
    public void   setWeightKg(Double v)     { this.weightKg = v; }
    public Double getLengthCm()             { return lengthCm; }
    public void   setLengthCm(Double v)     { this.lengthCm = v; }
    public Double getWidthCm()              { return widthCm; }
    public void   setWidthCm(Double v)      { this.widthCm = v; }
    public Double getHeightCm()             { return heightCm; }
    public void   setHeightCm(Double v)     { this.heightCm = v; }
    public UUID   getTeamId()               { return teamId; }
    public void   setTeamId(UUID v)         { this.teamId = v; }
    public String getTeamName()             { return teamName; }
    public void   setTeamName(String v)     { this.teamName = v; }
    public String getTeamCode()             { return teamCode; }
    public void   setTeamCode(String v)     { this.teamCode = v; }
    public String getTeamLogoUrl()          { return teamLogoUrl; }
    public void   setTeamLogoUrl(String v)  { this.teamLogoUrl = v; }
    public int    getTotalMatches()         { return totalMatches; }
    public void   setTotalMatches(int v)    { this.totalMatches = v; }
    public int    getTotalWins()            { return totalWins; }
    public void   setTotalWins(int v)       { this.totalWins = v; }
    public int    getTotalLosses()          { return totalLosses; }
    public void   setTotalLosses(int v)     { this.totalLosses = v; }
    public int    getTotalPoints()          { return totalPoints; }
    public void   setTotalPoints(int v)     { this.totalPoints = v; }
    public int    getEventsPlayed()         { return eventsPlayed; }
    public void   setEventsPlayed(int v)    { this.eventsPlayed = v; }
    public int    getGoldMedals()           { return goldMedals; }
    public void   setGoldMedals(int v)      { this.goldMedals = v; }
    public int    getSilverMedals()         { return silverMedals; }
    public void   setSilverMedals(int v)    { this.silverMedals = v; }
    public int    getBronzeMedals()         { return bronzeMedals; }
    public void   setBronzeMedals(int v)    { this.bronzeMedals = v; }
    public List<TournamentRecord> getRecords()           { return records; }
    public void setRecords(List<TournamentRecord> v)     { this.records = v; }
}
