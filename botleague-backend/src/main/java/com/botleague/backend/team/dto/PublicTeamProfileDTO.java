package com.botleague.backend.team.dto;

import java.util.List;
import java.util.UUID;

public class PublicTeamProfileDTO {

    // ── Identity ──────────────────────────────────────────────────────────────
    private UUID    teamId;
    private String  teamCode;
    private String  teamName;
    private String  status;
    private String  logoUrl;
    private String  description;
    private String  institutionName;
    private String  city;
    private String  state;
    private String  country;

    // ── Aggregated global stats ───────────────────────────────────────────────
    private int     totalPoints;
    private int     totalWins;
    private int     totalLosses;
    private int     matchesPlayed;
    private int     eventsPlayed;
    private Integer bestGlobalRank;   // null if not yet ranked
    private int     goldMedals;
    private int     silverMedals;
    private int     bronzeMedals;

    // ── Per-event sport records ───────────────────────────────────────────────
    private List<EventRecord> eventRecords;

    public static class EventRecord {
        private UUID    eventId;
        private String  eventName;
        private UUID    eventSportId;
        private String  sport;
        private String  ageGroup;
        private String  weightClass;
        private Integer eventRank;      // position on leaderboard (1 = champion)
        private int     matchesPlayed;
        private int     wins;
        private int     losses;
        private int     pointsEarned;
        private boolean isFinalized;
        private String  robotName;

        public UUID    getEventId()       { return eventId; }
        public void    setEventId(UUID v) { this.eventId = v; }
        public String  getEventName()         { return eventName; }
        public void    setEventName(String v) { this.eventName = v; }
        public UUID    getEventSportId()           { return eventSportId; }
        public void    setEventSportId(UUID v)     { this.eventSportId = v; }
        public String  getSport()              { return sport; }
        public void    setSport(String v)      { this.sport = v; }
        public String  getAgeGroup()           { return ageGroup; }
        public void    setAgeGroup(String v)   { this.ageGroup = v; }
        public String  getWeightClass()        { return weightClass; }
        public void    setWeightClass(String v){ this.weightClass = v; }
        public Integer getEventRank()          { return eventRank; }
        public void    setEventRank(Integer v) { this.eventRank = v; }
        public int     getMatchesPlayed()        { return matchesPlayed; }
        public void    setMatchesPlayed(int v)   { this.matchesPlayed = v; }
        public int     getWins()               { return wins; }
        public void    setWins(int v)          { this.wins = v; }
        public int     getLosses()             { return losses; }
        public void    setLosses(int v)        { this.losses = v; }
        public int     getPointsEarned()       { return pointsEarned; }
        public void    setPointsEarned(int v)  { this.pointsEarned = v; }
        public boolean isFinalized()           { return isFinalized; }
        public void    setFinalized(boolean v) { this.isFinalized = v; }
        public String  getRobotName()          { return robotName; }
        public void    setRobotName(String v)  { this.robotName = v; }
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public UUID    getTeamId()               { return teamId; }
    public void    setTeamId(UUID v)         { this.teamId = v; }
    public String  getTeamCode()             { return teamCode; }
    public void    setTeamCode(String v)     { this.teamCode = v; }
    public String  getTeamName()             { return teamName; }
    public void    setTeamName(String v)     { this.teamName = v; }
    public String  getStatus()               { return status; }
    public void    setStatus(String v)       { this.status = v; }
    public String  getLogoUrl()              { return logoUrl; }
    public void    setLogoUrl(String v)      { this.logoUrl = v; }
    public String  getDescription()          { return description; }
    public void    setDescription(String v)  { this.description = v; }
    public String  getInstitutionName()      { return institutionName; }
    public void    setInstitutionName(String v){ this.institutionName = v; }
    public String  getCity()                 { return city; }
    public void    setCity(String v)         { this.city = v; }
    public String  getState()                { return state; }
    public void    setState(String v)        { this.state = v; }
    public String  getCountry()              { return country; }
    public void    setCountry(String v)      { this.country = v; }
    public int     getTotalPoints()          { return totalPoints; }
    public void    setTotalPoints(int v)     { this.totalPoints = v; }
    public int     getTotalWins()            { return totalWins; }
    public void    setTotalWins(int v)       { this.totalWins = v; }
    public int     getTotalLosses()          { return totalLosses; }
    public void    setTotalLosses(int v)     { this.totalLosses = v; }
    public int     getMatchesPlayed()        { return matchesPlayed; }
    public void    setMatchesPlayed(int v)   { this.matchesPlayed = v; }
    public int     getEventsPlayed()         { return eventsPlayed; }
    public void    setEventsPlayed(int v)    { this.eventsPlayed = v; }
    public Integer getBestGlobalRank()       { return bestGlobalRank; }
    public void    setBestGlobalRank(Integer v){ this.bestGlobalRank = v; }
    public int     getGoldMedals()           { return goldMedals; }
    public void    setGoldMedals(int v)      { this.goldMedals = v; }
    public int     getSilverMedals()         { return silverMedals; }
    public void    setSilverMedals(int v)    { this.silverMedals = v; }
    public int     getBronzeMedals()         { return bronzeMedals; }
    public void    setBronzeMedals(int v)    { this.bronzeMedals = v; }
    public List<EventRecord> getEventRecords()         { return eventRecords; }
    public void    setEventRecords(List<EventRecord> v){ this.eventRecords = v; }
}
