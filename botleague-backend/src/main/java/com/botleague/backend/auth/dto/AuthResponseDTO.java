package com.botleague.backend.auth.dto;

/** What the client actually receives in the body. Refresh token is in the cookie. */
public class AuthResponseDTO {

    private String accessToken;
    private String botleagueId;
    /** Seconds until the access token expires — lets the frontend schedule a proactive refresh. */
    private long expiresIn;
    /** True only for a just-registered account awaiting admin approval — accessToken
     *  is null and expiresIn is 0 in that case; see AuthResponseDTO.pending(). */
    private boolean pendingApproval;
    private String message;

    public AuthResponseDTO(String accessToken, String botleagueId, long expiresIn) {
        this.accessToken = accessToken;
        this.botleagueId = botleagueId;
        this.expiresIn   = expiresIn;
    }

    /** Registration succeeded but the account needs admin approval before it's usable. */
    public static AuthResponseDTO pending(String botleagueId, String message) {
        AuthResponseDTO dto = new AuthResponseDTO(null, botleagueId, 0);
        dto.pendingApproval = true;
        dto.message = message;
        return dto;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getBotleagueId() { return botleagueId; }
    public void setBotleagueId(String botleagueId) { this.botleagueId = botleagueId; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public boolean isPendingApproval() { return pendingApproval; }
    public void setPendingApproval(boolean pendingApproval) { this.pendingApproval = pendingApproval; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}