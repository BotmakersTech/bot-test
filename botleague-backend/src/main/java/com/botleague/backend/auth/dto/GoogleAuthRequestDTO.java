package com.botleague.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleAuthRequestDTO {

    @NotBlank(message = "ID token is required")
    private String idToken;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
}
