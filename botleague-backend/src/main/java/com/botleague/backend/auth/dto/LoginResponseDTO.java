package com.botleague.backend.auth.dto;

public class LoginResponseDTO {

    private String token;
    private String botleagueId;

    // ================= GETTERS & SETTERS =================

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getBotleagueId() {
        return botleagueId;
    }

    public void setBotleagueId(String botleagueId) {
        this.botleagueId = botleagueId;
    }
}