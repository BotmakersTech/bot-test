package com.botleague.backend.role.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.role.entity.UserRole;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    Optional<UserRole> findByUserIdAndRoleType(UUID userId, AccountType roleType);

    boolean existsByUserIdAndRoleType(UUID userId, AccountType roleType);

    java.util.List<UserRole> findByUserId(UUID userId);

    java.util.List<UserRole> findByRoleTypeIn(java.util.List<AccountType> roleTypes);

}