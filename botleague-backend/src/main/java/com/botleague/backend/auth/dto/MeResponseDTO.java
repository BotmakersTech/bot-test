package com.botleague.backend.auth.dto;

import java.util.List;

public class MeResponseDTO {

    private String botleagueId;
    private String email;
    private String phone;
    private String role;           // highest-privilege role
    private List<String> allRoles;
    private List<String> assignedEventIds;
    private List<String> assignedSportIds;

    public String getBotleagueId() { return botleagueId; }
    public void setBotleagueId(String botleagueId) { this.botleagueId = botleagueId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public List<String> getAllRoles() { return allRoles; }
    public void setAllRoles(List<String> allRoles) { this.allRoles = allRoles; }

    public List<String> getAssignedEventIds() { return assignedEventIds; }
    public void setAssignedEventIds(List<String> assignedEventIds) { this.assignedEventIds = assignedEventIds; }

    public List<String> getAssignedSportIds() { return assignedSportIds; }
    public void setAssignedSportIds(List<String> assignedSportIds) { this.assignedSportIds = assignedSportIds; }
}
