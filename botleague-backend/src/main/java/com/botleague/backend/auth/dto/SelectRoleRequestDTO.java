package com.botleague.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class SelectRoleRequestDTO {

    // Same closed whitelist as RegisterRequestDTO.role — ADMIN/SUPER_ADMIN/
    // EVENT_HEAD/SPORT_HEAD are admin-appointed only and must never be
    // reachable through self-service role selection.
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "COMPETITOR|VOLUNTEER|ORGANISER|JUDGE", message = "Invalid role")
    private String role;

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
