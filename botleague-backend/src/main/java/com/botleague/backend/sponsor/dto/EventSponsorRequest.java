package com.botleague.backend.sponsor.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EventSponsorRequest {

    @NotBlank
    @Size(max = 150)
    private String sponsorName;

    @Size(max = 80)
    private String sponsorType;

    @Size(max = 255)
    private String website;

    @Size(max = 500)
    private String logoUrl;

    private Integer displayOrder;

    public String getSponsorName() { return sponsorName; }
    public void setSponsorName(String sponsorName) { this.sponsorName = sponsorName; }

    public String getSponsorType() { return sponsorType; }
    public void setSponsorType(String sponsorType) { this.sponsorType = sponsorType; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
