package com.botleague.backend.catalog.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class CreateLeagueRequest {

    @NotBlank(message = "slug is required")
    private String slug;
    @NotBlank(message = "ageGroupCode is required")
    private String ageGroupCode;
    @NotBlank(message = "name is required")
    private String name;
    @Min(value = 0, message = "minAge cannot be negative")
    private Integer minAge;
    @Min(value = 0, message = "maxAge cannot be negative")
    private Integer maxAge;
    private String tagline;
    private String description;
    private String primaryColor;
    private String secondaryColor;
    private List<String> whatYouGet;
    private String rankingScope;
    private UUID nextLeagueId;
    private Integer displayOrder;

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

    public List<String> getWhatYouGet() { return whatYouGet; }
    public void setWhatYouGet(List<String> whatYouGet) { this.whatYouGet = whatYouGet; }

    public String getRankingScope() { return rankingScope; }
    public void setRankingScope(String rankingScope) { this.rankingScope = rankingScope; }

    public UUID getNextLeagueId() { return nextLeagueId; }
    public void setNextLeagueId(UUID nextLeagueId) { this.nextLeagueId = nextLeagueId; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
