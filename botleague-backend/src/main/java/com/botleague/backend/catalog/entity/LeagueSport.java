package com.botleague.backend.catalog.entity;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.botleague.backend.events.converter.StringMapJsonConverter;
import com.botleague.backend.team.enums.ControlMode;

import jakarta.persistence.*;

/**
 * A Sport's specs *within* one League (e.g. "Robo Soccer under Inferno" is
 * 3kg/30x30x30, "Robo Soccer under Apex" is 5kg/45x45x45) — this is where
 * the actual per-league spec lives, plus the DRAFT/LIVE gate that controls
 * whether organisers can pick this pairing when setting up an event's sports.
 *
 * Field names mirror EventSports 1:1 so applying a preset onto a new
 * EventSports row is a straight copy, not a remap.
 */
@Entity
@Table(
        name = "league_sports",
        uniqueConstraints = @UniqueConstraint(name = "uk_league_sport", columnNames = {"league_id", "sport_id"}),
        indexes = {
                @Index(name = "idx_league_sport_league", columnList = "league_id"),
                @Index(name = "idx_league_sport_sport", columnList = "sport_id")
        }
)
public class LeagueSport {

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_LIVE = "LIVE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "league_id", nullable = false)
    private UUID leagueId;

    @Column(name = "sport_id", nullable = false)
    private UUID sportId;

    @Column(name = "weight_limit_kg")
    private Double weightLimitKg;

    @Column(name = "max_length_cm")
    private Double maxLengthCm;

    @Column(name = "max_width_cm")
    private Double maxWidthCm;

    @Column(name = "max_height_cm")
    private Double maxHeightCm;

    @Enumerated(EnumType.STRING)
    @Column(name = "control_type", length = 20)
    private ControlMode controlType;

    @Column(name = "max_bots_per_team")
    private Integer maxBotsPerTeam;

    /**
     * Raw JSON array of {"label":"...","weightKg":...} objects — handles a
     * sport offering several weight classes under one league (e.g. Apex's
     * Robo War: 1.5kg + 60kg). Parsed/serialized directly in the service
     * layer (list shape, not the Map<String,String> StringMapJsonConverter
     * handles). Null/empty = the single weightLimitKg column is authoritative.
     */
    @Column(name = "weight_classes_json", columnDefinition = "TEXT")
    private String weightClassesJson;

    /**
     * Anything sport-specific that doesn't deserve its own column (drone
     * diameter-cm, line-follower track size, RC scale/fuel, ...).
     */
    @Convert(converter = StringMapJsonConverter.class)
    @Column(name = "extra_specs_json", columnDefinition = "TEXT")
    private Map<String, String> extraSpecs = new HashMap<>();

    /** Free-text operational flag, e.g. "Placeholder spec pending real numbers". */
    @Column(name = "entry_note", length = 300)
    private String entryNote;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_DRAFT;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }

    public UUID getLeagueId() { return leagueId; }
    public void setLeagueId(UUID leagueId) { this.leagueId = leagueId; }

    public UUID getSportId() { return sportId; }
    public void setSportId(UUID sportId) { this.sportId = sportId; }

    public Double getWeightLimitKg() { return weightLimitKg; }
    public void setWeightLimitKg(Double weightLimitKg) { this.weightLimitKg = weightLimitKg; }

    public Double getMaxLengthCm() { return maxLengthCm; }
    public void setMaxLengthCm(Double maxLengthCm) { this.maxLengthCm = maxLengthCm; }

    public Double getMaxWidthCm() { return maxWidthCm; }
    public void setMaxWidthCm(Double maxWidthCm) { this.maxWidthCm = maxWidthCm; }

    public Double getMaxHeightCm() { return maxHeightCm; }
    public void setMaxHeightCm(Double maxHeightCm) { this.maxHeightCm = maxHeightCm; }

    public ControlMode getControlType() { return controlType; }
    public void setControlType(ControlMode controlType) { this.controlType = controlType; }

    public Integer getMaxBotsPerTeam() { return maxBotsPerTeam; }
    public void setMaxBotsPerTeam(Integer maxBotsPerTeam) { this.maxBotsPerTeam = maxBotsPerTeam; }

    public String getWeightClassesJson() { return weightClassesJson; }
    public void setWeightClassesJson(String weightClassesJson) { this.weightClassesJson = weightClassesJson; }

    public Map<String, String> getExtraSpecs() { return extraSpecs; }
    public void setExtraSpecs(Map<String, String> extraSpecs) { this.extraSpecs = extraSpecs; }

    public String getEntryNote() { return entryNote; }
    public void setEntryNote(String entryNote) { this.entryNote = entryNote; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getVersion() { return version; }
}
