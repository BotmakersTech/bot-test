package com.botleague.backend.dashboard.dto;

import java.util.List;

import com.botleague.backend.team.dto.RobotResponseDTO;

public class DashboardResponse {

    // =========================
    // FIELDS
    // =========================

    private ProfileDTO profile;

    private List<RobotResponseDTO> robots;

    private List<TeamsDTO> teams;

    private List<InvitesDTO> invite;

    private List<EventDTO> events;

    // =========================
    // CONSTRUCTOR
    // =========================

    public DashboardResponse(
            ProfileDTO profile,
            List<RobotResponseDTO> robots,
            List<TeamsDTO> teams,
            List<InvitesDTO> invites,
            List<EventDTO> events
    ) {

        this.profile = profile;

        this.robots = robots;

        this.teams = teams;

        this.invite = invites;

        this.events = events;
    }

    // =========================
    // GETTERS
    // =========================

    public ProfileDTO getProfile() {
        return profile;
    }

    public List<RobotResponseDTO> getRobots() {
        return robots;
    }

    public List<TeamsDTO> getTeams() {
        return teams;
    }

    public List<InvitesDTO> getInvite() {
        return invite;
    }

    public List<EventDTO> getEvents() {
        return events;
    }

    // =========================
    // SETTERS
    // =========================

    public void setProfile(
            ProfileDTO profile
    ) {
        this.profile = profile;
    }

    public void setRobots(
            List<RobotResponseDTO> robots
    ) {
        this.robots = robots;
    }

    public void setTeams(
            List<TeamsDTO> teams
    ) {
        this.teams = teams;
    }

    public void setInvite(
            List<InvitesDTO> invite
    ) {
        this.invite = invite;
    }

    public void setEvents(
            List<EventDTO> events
    ) {
        this.events = events;
    }
}