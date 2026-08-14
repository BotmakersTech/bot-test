package com.botleague.backend.catalog.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;

/**
 * A competition tier (e.g. "Ignite", "Inferno", "Apex"). ageGroupCode is the
 * stable vocabulary key eligibility/registration code keys off (the same
 * strings previously hardcoded as the AgeCategory enum, e.g.
 * "JUNIOR_INNOVATORS") — kept separate from slug/name so marketing branding
 * can change freely without touching eligibility-critical data.
 */
@Entity
@Table(
        name = "leagues",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_league_slug", columnNames = {"slug"}),
                @UniqueConstraint(name = "uk_league_age_group_code", columnNames = {"age_group_code"})
        }
)
public class League {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_DISABLED = "DISABLED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "slug", nullable = false, length = 60)
    private String slug;

    /** Stable eligibility key, e.g. "JUNIOR_INNOVATORS" — never shown to users. */
    @Column(name = "age_group_code", nullable = false, length = 60)
    private String ageGroupCode;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "min_age")
    private Integer minAge;

    /** Null = unbounded (e.g. Apex "18+"). */
    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "tagline", length = 200)
    private String tagline;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "primary_color", length = 20)
    private String primaryColor;

    @Column(name = "secondary_color", length = 20)
    private String secondaryColor;

    /** JSON array of bullet strings ("What you get") — free-form marketing copy. */
    @Column(name = "what_you_get_json", columnDefinition = "TEXT")
    private String whatYouGetJson;

    @Column(name = "ranking_scope", length = 40)
    private String rankingScope;

    /** Self-referential — replaces the old hardcoded league->league chain. */
    @Column(name = "next_league_id")
    private UUID nextLeagueId;

    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_ACTIVE;

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

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getAgeGroupCode() { return ageGroupCode; }
    public void setAgeGroupCode(String ageGroupCode) { this.ageGroupCode = ageGroupCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getMinAge() { return minAge; }
    public void setMinAge(Integer minAge) { this.minAge = minAge; }

    public Integer getMaxAge() { return maxAge; }
    public void setMaxAge(Integer maxAge) { this.maxAge = maxAge; }

    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }

    public String getSecondaryColor() { return secondaryColor; }
    public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }

    public String getWhatYouGetJson() { return whatYouGetJson; }
    public void setWhatYouGetJson(String whatYouGetJson) { this.whatYouGetJson = whatYouGetJson; }

    public String getRankingScope() { return rankingScope; }
    public void setRankingScope(String rankingScope) { this.rankingScope = rankingScope; }

    public UUID getNextLeagueId() { return nextLeagueId; }
    public void setNextLeagueId(UUID nextLeagueId) { this.nextLeagueId = nextLeagueId; }

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
