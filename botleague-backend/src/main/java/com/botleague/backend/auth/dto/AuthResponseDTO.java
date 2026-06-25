package com.botleague.backend.auth.dto;

/** What the client actually receives in the body. Refresh token is in the cookie. */
public class AuthResponseDTO {

    private String accessToken;
    private String botleagueId;
    /** Seconds until the access token expires — lets the frontend schedule a proactive refresh. */
    private long expiresIn;

    public AuthResponseDTO(String accessToken, String botleagueId, long expiresIn) {
        this.accessToken = accessToken;
        this.botleagueId = botleagueId;
        this.expiresIn   = expiresIn;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getBotleagueId() { return botleagueId; }
    public void setBotleagueId(String botleagueId) { this.botleagueId = botleagueId; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
}