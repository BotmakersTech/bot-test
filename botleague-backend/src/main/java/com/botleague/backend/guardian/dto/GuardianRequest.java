package com.botleague.backend.guardian.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class GuardianRequest {

    @NotBlank(message = "Guardian name is required")
    @Size(max = 120)
    private String guardianName;

    @NotBlank(message = "Relationship is required")
    @Size(max = 60)
    private String relationship;

    // A real OTP is sent to this number (see OtpService) — must match the
    // same 10-digit convention used for the account holder's own phone
    // (VerifyPhoneRequestDTO).
    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be 10 digits")
    private String mobileNumber;

    @Size(max = 150)
    private String email;

    @NotBlank(message = "Emergency contact is required")
    @Size(max = 20)
    private String emergencyContact;

    public String getGuardianName() { return guardianName; }
    public void setGuardianName(String guardianName) { this.guardianName = guardianName; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
}
