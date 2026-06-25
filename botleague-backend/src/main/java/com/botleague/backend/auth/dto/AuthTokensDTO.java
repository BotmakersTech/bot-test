package com.botleague.backend.auth.dto;

/**
 * Returned on register / login / refresh.
 * accessToken  -> client keeps in memory, sends as Authorization: Bearer
 * refreshToken -> set as an httpOnly, Secure, SameSite cookie by the controller
 */
public class AuthTokensDTO {

    private String accessToken;
    private String refreshToken;
    private String botleagueId;

    public AuthTokensDTO(String accessToken, String refreshToken, String botleagueId) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.botleagueId = botleagueId;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getBotleagueId() { return botleagueId; }
    public void setBotleagueId(String botleagueId) { this.botleagueId = botleagueId; }
}