package com.botleague.backend.events.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.botleague.backend.events.converter.StringMapJsonConverter;
import com.botleague.backend.events.enums.AgeCategory;
import com.botleague.backend.events.enums.CompetitionType;


import com.botleague.backend.events.enums.SportEventStatus;
import com.botleague.backend.team.enums.ControlMode;

import jakarta.persistence.*;

/**
 * One competition inside an event. ONE ROW = one (sport + age group + weight class).
 *
 * Different sports need different constraints, so the physical limits below are
 * ALL OPTIONAL. A sport only fills the ones it cares about:
 *   - RoboSumo  -> weightLimitKg + size + controlType
 *   - RoboWar   -> one row PER weight class (1.5 / 8 / 15 / 30 / 60 kg)
 *   - Drone     -> mostly extraRules (fpv=true, diagonalCm=20, ...)
 *   - RC Racing -> extraRules (scale=1:8, fuel=nitro,electric, ...)
 *   - Project   -> no physical limits at all
 * Anything that doesn't fit a typed column goes into extraRules.
 */
@Entity
@Table(
    name = "event_sports",
    uniqueConstraints = @UniqueConstraint(
        // weight_class added so one sport can have several weight classes (e.g. RoboWar)
        name = "uk_event_sport_age_weight",
        columnNames = {"event_id", "sport", "age_group", "weight_class"}
    ),
    indexes = {
        @Index(name = "idx_event_id", columnList = "event_id"),
        @Index(name = "idx_event_sport", columnList = "sport"),
        @Index(name = "idx_event_competition_type", columnList = "competition_type"),
        @Index(name = "idx_event_age_group", columnList = "age_group")
    }
)
public class EventSports {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // =========================
    // RELATION KEYS
    // =========================

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    // =========================
    // CORE IDENTIFIERS
    // =========================

    @Column(nullable = false, length = 100)
    private String sport; // human-readable name, e.g. "RoboWar", "Drone Racing (FPV)"

    @Enumerated(EnumType.STRING)
    @Column(name = "competition_type", length = 40)
    private CompetitionType competitionType; // the KIND of sport (drives which rules apply)

    // was "sportsDescripction" / column "SportsInfo" -> fixed spelling + snake_case
    @Column(name = "sports_info")
    private String sportsDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "age_group", nullable = false, length = 50)
    private AgeCategory ageGroup;

    // =========================
    // PHYSICAL CONSTRAINTS (all optional - a sport fills only what it needs)
    // =========================

    @Column(name = "weight_class", length = 50)
    private String weightClass; // label, e.g. "1.5kg", "Featherweight"

    @Column(name = "weight_limit_kg")
    private Double weightLimitKg; // numeric cap used for validation

    @Column(name = "max_length_cm")
    private Double maxLengthCm;

    @Column(name = "max_width_cm")
    private Double maxWidthCm;

    @Column(name = "max_height_cm")
    private Double maxHeightCm;

    @Enumerated(EnumType.STRING)
    @Column(name = "control_type", length = 20)
    private ControlMode controlType; // WIRED / WIRELESS / ANY (null = not applicable)

    // max robots a single team may enter in THIS competition (null = no limit).
    // e.g. Plug N Play "single bot for both" -> 1
    @Column(name = "max_bots_per_team")
    private Integer maxBotsPerTeam;

    // Anything sport-specific that doesn't deserve its own column:
    // drone: {"fpv":"true","diagonalCm":"20"}
    // rc:    {"scale":"1:8,1:12","fuel":"nitro,electric"}
    // line:  {"autonomy":"AUTONOMOUS"}
    @Convert(converter = StringMapJsonConverter.class)
    @Column(name = "extra_rules", columnDefinition = "TEXT")
    private Map<String, String> extraRules = new HashMap<>();

    // =========================
    // CONFIGURATION (kept from before)
    // =========================

    @Column(name = "min_team_size", nullable = false)
    private Integer minTeamSize = 1; // people on a team (roster)

    @Column(name = "max_team_size", nullable = false)
    private Integer maxTeamSize = 10; // people on a team (roster)

    @Column(name = "max_teams")
    private Integer maxTeams; // capacity: max entries/teams in this competition

    // =========================
    // FINANCIALS
    // =========================

    @Column(name = "entry_fee", nullable = false)
    private Double entryFee = 0.0;

    @Column(name = "prize_money", nullable = false)
    private Double prizeMoney = 0.0;

    // =========================
    // FORMAT
    // =========================

    @Column(name = "format_type", length = 50)
    private String formatType; // e.g. "Single Elimination", "Round Robin", "Time Trial"

    @Column(name = "registration_start_date", nullable = false)
    private LocalDate registrationStartDate;

    @Column(name = "registration_end_date", nullable = false)
    private LocalDate registrationEndDate;

    // =========================
    // STATUS
    // =========================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SportEventStatus status = SportEventStatus.REGISTRATION_OPEN;

    // =========================
    // METRICS
    // =========================

    @Column(name = "registered_teams_count")
    private Integer registeredTeamsCount = 0;

    @Column(name = "bracket_generated", nullable = false, columnDefinition = "boolean DEFAULT false")
    private boolean bracketGenerated = false;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    // =========================
    // AUDIT
    // =========================

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =========================
    // LIFECYCLE
    // =========================

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        validate();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        // Full validate() is called by the service on create/edit.
        // On every update (e.g. status toggle) we skip heavy validation
        // so a simple toggle doesn't fail on unrelated date fields.
    }

    // =========================
    // BUSINESS RULES
    // =========================

    public void validate() {
        if (minTeamSize > maxTeamSize) {
            throw new IllegalArgumentException("Min team size cannot be greater than max team size");
        }
        if (entryFee < 0 || prizeMoney < 0) {
            throw new IllegalArgumentException("Financial values cannot be negative");
        }
        if (weightLimitKg != null && weightLimitKg < 0) {
            throw new IllegalArgumentException("Weight limit cannot be negative");
        }
        if ((maxLengthCm != null && maxLengthCm < 0)
                || (maxWidthCm != null && maxWidthCm < 0)
                || (maxHeightCm != null && maxHeightCm < 0)) {
            throw new IllegalArgumentException("Size limits cannot be negative");
        }
        if (registrationStartDate != null && registrationEndDate != null
                && registrationEndDate.isBefore(registrationStartDate)) {
            throw new IllegalArgumentException("Registration end date cannot be before start date");
        }
    }

    /** True when this competition is currently accepting registrations. */
    public boolean isRegistrationOpen(LocalDate today) {
        return status == SportEventStatus.REGISTRATION_OPEN
                && registrationStartDate != null
                && registrationEndDate != null
                && !today.isBefore(registrationStartDate)
                && !today.isAfter(registrationEndDate);
    }

    /** True when the competition has reached its capacity. */
    public boolean isFull() {
        return maxTeams != null
                && registeredTeamsCount != null
                && registeredTeamsCount >= maxTeams;
    }

    // convenience accessors for the flexible rules
    public void putRule(String key, String value) { this.extraRules.put(key, value); }
    public String getRule(String key) { return this.extraRules.get(key); }

    // =========================
    // GETTERS & SETTERS
    // =========================

    public UUID getId() { return id; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public CompetitionType getCompetitionType() { return competitionType; }
    public void setCompetitionType(CompetitionType competitionType) { this.competitionType = competitionType; }

    public String getSportsDescription() { return sportsDescription; }
    public void setSportsDescription(String sportsDescription) { this.sportsDescription = sportsDescription; }

    public AgeCategory getAgeGroup() { return ageGroup; }
    public void setAgeGroup(AgeCategory ageGroup) { this.ageGroup = ageGroup; }

    public String getWeightClass() { return weightClass; }
    public void setWeightClass(String weightClass) { this.weightClass = weightClass; }

    public Double getWeightLimitKg() { return weightLimitKg; }
    public void setWeightLimitKg(Double weightLimitKg) { this.weightLimitKg = weightLimitKg; }

    public Double getMaxLengthCm() { return maxLengthCm; }
    public void setMaxLengthCm(Double maxLengthCm) { this.maxLengthCm = maxLengthCm; }

    public Double getMaxWidthCm() { return maxWidthCm; }
    public void setMaxWidthCm(Double maxWidthCm) { this.maxWidthCm = maxWidthCm; }

    public Double getMaxHeightCm() { return maxHeightCm; }
    public void setMaxHeightCm(Double maxHeightCm) { this.maxHeightCm = maxHeightCm; }

    public ControlMode getControlType() { return controlType; }
    public void setControlType(ControlMode controlMode) { this.controlType = controlMode; }

    public Integer getMaxBotsPerTeam() { return maxBotsPerTeam; }
    public void setMaxBotsPerTeam(Integer maxBotsPerTeam) { this.maxBotsPerTeam = maxBotsPerTeam; }

    public Map<String, String> getExtraRules() { return extraRules; }
    public void setExtraRules(Map<String, String> extraRules) { this.extraRules = extraRules; }

    public Integer getMinTeamSize() { return minTeamSize; }
    public void setMinTeamSize(Integer minTeamSize) { this.minTeamSize = minTeamSize; }

    public Integer getMaxTeamSize() { return maxTeamSize; }
    public void setMaxTeamSize(Integer maxTeamSize) { this.maxTeamSize = maxTeamSize; }

    public Integer getMaxTeams() { return maxTeams; }
    public void setMaxTeams(Integer maxTeams) { this.maxTeams = maxTeams; }

    public Double getEntryFee() { return entryFee; }
    public void setEntryFee(Double entryFee) { this.entryFee = entryFee; }

    public Double getPrizeMoney() { return prizeMoney; }
    public void setPrizeMoney(Double prizeMoney) { this.prizeMoney = prizeMoney; }

    public String getFormatType() { return formatType; }
    public void setFormatType(String formatType) { this.formatType = formatType; }

    public LocalDate getRegistrationStartDate() { return registrationStartDate; }
    public void setRegistrationStartDate(LocalDate registrationStartDate) { this.registrationStartDate = registrationStartDate; }

    public LocalDate getRegistrationEndDate() { return registrationEndDate; }
    public void setRegistrationEndDate(LocalDate registrationEndDate) { this.registrationEndDate = registrationEndDate; }

    public SportEventStatus getStatus() { return status; }
    public void setStatus(SportEventStatus status) { this.status = status; }

    public Integer getRegisteredTeamsCount() { return registeredTeamsCount; }
    public void setRegisteredTeamsCount(Integer registeredTeamsCount) { this.registeredTeamsCount = registeredTeamsCount; }

    public boolean isBracketGenerated() { return bracketGenerated; }
    public void setBracketGenerated(boolean bracketGenerated) { this.bracketGenerated = bracketGenerated; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}