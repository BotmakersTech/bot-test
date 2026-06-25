package com.botleague.backend.auth.dto;

import com.botleague.backend.auth.enums.LoginType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LoginRequestDTO {

    @NotBlank(message = "Identifier is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Login type is required")
    private LoginType loginType;

    // ================= GETTERS & SETTERS =================

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LoginType getLoginType() {
        return loginType;
    }

    public void setLoginType(LoginType loginType) { // ✅ FIXED
        this.loginType = loginType;
    }
}