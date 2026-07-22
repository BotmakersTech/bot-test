package com.botleague.backend.certificate.dto;

import java.util.List;

/** All fields optional — only non-null fields are applied (PATCH semantics). */
public class UpdateCertificateTemplateRequest {

    private String name;
    private List<TemplatePlaceholderPosition> placeholderMap;
    private String status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<TemplatePlaceholderPosition> getPlaceholderMap() { return placeholderMap; }
    public void setPlaceholderMap(List<TemplatePlaceholderPosition> placeholderMap) { this.placeholderMap = placeholderMap; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
