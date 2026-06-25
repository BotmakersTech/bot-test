package com.botleague.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequestDTO {

    @NotBlank(message = "Identifier is required")
    private String identifier; // phone OR email

    // ================= GETTERS & SETTERS =================

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }
}