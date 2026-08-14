package com.botleague.backend.catalog.dto;

/** All fields optional — only non-null fields are applied (PATCH semantics). */
public class UpdateSportRequest {

    private String name;
    private String slug;
    private String competitionTypeHint;
    private String description;
    private String iconUrl;
    private String status;
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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
