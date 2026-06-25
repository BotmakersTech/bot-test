package com.botleague.backend.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ChangePhoneRequestDTO {

    @NotBlank(message = "New phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
    private String newPhone;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^[0-9]{4}$", message = "OTP must be 4 digits")
    private String otp;

    public String getNewPhone() { return newPhone; }
    public void setNewPhone(String v) { this.newPhone = v; }
    public String getOtp() { return otp; }
    public void setOtp(String v) { this.otp = v; }
}
