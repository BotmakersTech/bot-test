package com.botleague.backend.auth.dto;

public class RegisterResponseDTO {

    private String botleagueId;
    private String token;
    private String message;

    // ================= GETTERS & SETTERS =================

    public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public String getBotleagueId() {
        return botleagueId;
    }

    public void setBotleagueId(String botleagueId) {
        this.botleagueId = botleagueId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    
}