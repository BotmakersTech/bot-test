package com.botleague.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateAdminUserRequest {

    @NotBlank private String firstName;
    @NotBlank private String lastName;

    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
    private String phone;

    private String email;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    /** Initial role to assign (e.g. COMPETITOR, ORGANIZER, MANAGER …) */
    @NotBlank private String role;

    public String getFirstName()      { return firstName; }
    public void setFirstName(String v){ this.firstName = v; }
    public String getLastName()       { return lastName; }
    public void setLastName(String v) { this.lastName = v; }
    public String getPhone()          { return phone; }
    public void setPhone(String v)    { this.phone = v; }
    public String getEmail()          { return email; }
    public void setEmail(String v)    { this.email = v; }
    public String getPassword()       { return password; }
    public void setPassword(String v) { this.password = v; }
    public String getRole()           { return role; }
    public void setRole(String v)     { this.role = v; }
}
