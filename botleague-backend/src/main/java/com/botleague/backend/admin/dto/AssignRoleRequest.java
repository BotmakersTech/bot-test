package com.botleague.backend.admin.dto;

import com.botleague.backend.auth.enums.AccountType;
import jakarta.validation.constraints.NotNull;

public class AssignRoleRequest {

    @NotNull
    private AccountType role;

    public AccountType getRole() { return role; }
    public void setRole(AccountType role) { this.role = role; }
}
