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
    /** True only for a just-registered account that requires admin approval before
     *  it can be used — accessToken/refreshToken are null in that case, since no
     *  tokens are ever issued for an account that can't log in yet. */
    private boolean pendingApproval;

    public AuthTokensDTO(String accessToken, String refreshToken, String botleagueId) {
        this(accessToken, refreshToken, botleagueId, false);
    }

    public AuthTokensDTO(String accessToken, String refreshToken, String botleagueId, boolean pendingApproval) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.botleagueId = botleagueId;
        this.pendingApproval = pendingApproval;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getBotleagueId() { return botleagueId; }
    public void setBotleagueId(String botleagueId) { this.botleagueId = botleagueId; }

    public boolean isPendingApproval() { return pendingApproval; }
    public void setPendingApproval(boolean pendingApproval) { this.pendingApproval = pendingApproval; }
}