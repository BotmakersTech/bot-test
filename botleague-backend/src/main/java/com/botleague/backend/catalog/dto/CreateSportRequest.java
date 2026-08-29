package com.botleague.backend.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateSportRequest {

    @NotBlank(message = "name is required")
    private String name;
    @NotBlank(message = "slug is required")
    private String slug;
    private String competitionTypeHint;
    private String description;
    private String iconUrl;
    private Integer displayOrder;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getCompetitionTypeHint() { return competitionTypeHint; }
    public void setCompetitionTypeHint(String competitionTypeHint) { this.competitionTypeHint = competitionTypeHint; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIconUrl() { return iconUrl; }
    public void setIconUrl(String iconUrl) { this.iconUrl = iconUrl; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
