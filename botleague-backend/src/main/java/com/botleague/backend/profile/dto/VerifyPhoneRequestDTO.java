package com.botleague.backend.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyPhoneRequestDTO {

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
    private String phone;

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^[0-9]{4}$", message = "OTP must be 4 digits")
    private String otp;

    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getOtp() { return otp; }
    public void setOtp(String v) { this.otp = v; }
}
