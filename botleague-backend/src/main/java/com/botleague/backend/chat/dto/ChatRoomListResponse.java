package com.botleague.backend.chat.dto;

import java.util.List;

public class ChatRoomListResponse {

    private List<ChatRoomResponse> teamChats;
    private List<ChatRoomResponse> directChats;
    private List<ChatRoomResponse> registrationChats;
    private List<ChatRoomResponse> announcementChats;

    public ChatRoomListResponse() {}

    public ChatRoomListResponse(
            List<ChatRoomResponse> teamChats,
            List<ChatRoomResponse> directChats,
            List<ChatRoomResponse> registrationChats,
            List<ChatRoomResponse> announcementChats) {
        this.teamChats = teamChats;
        this.directChats = directChats;
        this.registrationChats = registrationChats;
        this.announcementChats = announcementChats;
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public List<ChatRoomResponse> getTeamChats() { return teamChats; }
    public void setTeamChats(List<ChatRoomResponse> teamChats) { this.teamChats = teamChats; }

    public List<ChatRoomResponse> getDirectChats() { return directChats; }
    public void setDirectChats(List<ChatRoomResponse> directChats) { this.directChats = directChats; }

    public List<ChatRoomResponse> getRegistrationChats() { return registrationChats; }
    public void setRegistrationChats(List<ChatRoomResponse> registrationChats) { this.registrationChats = registrationChats; }

    public List<ChatRoomResponse> getAnnouncementChats() { return announcementChats; }
    public void setAnnouncementChats(List<ChatRoomResponse> announcementChats) { this.announcementChats = announcementChats; }
}
