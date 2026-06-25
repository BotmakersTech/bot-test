package com.botleague.backend.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class AdminTeamDetail extends AdminTeamSummary {

    private String description;
    private UUID createdBy;
    private LocalDateTime updatedAt;
    private List<AdminTeamMemberDTO> members;

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<AdminTeamMemberDTO> getMembers() { return members; }
    public void setMembers(List<AdminTeamMemberDTO> members) { this.members = members; }
}
