package com.botleague.backend.organizer.dto;

import jakarta.validation.constraints.NotBlank;

public class BroadcastAnnounceRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    /** Optional chat message to post in the event announcement room. */
    private String chatMessage;

    public String getTitle()   { return title; }
    public void setTitle(String v) { this.title = v; }

    public String getMessage() { return message; }
    public void setMessage(String v) { this.message = v; }

    public String getChatMessage() { return chatMessage; }
    public void setChatMessage(String v) { this.chatMessage = v; }
}
