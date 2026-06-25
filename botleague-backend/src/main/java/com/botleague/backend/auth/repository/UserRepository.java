package com.botleague.backend.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.team.entity.TeamInvite;

public interface UserRepository extends JpaRepository<User, UUID> {

    // ================= BASIC LOOKUPS =================

    Optional<User> findByPhone(String phone);
   

    Optional<User> findByEmailIgnoreCase(String email); // ✅ better

    // ================= EXISTENCE CHECKS =================

    boolean existsByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email); // ✅ better

    // ================= AUTH OPTIMIZED =================

    @Query("SELECT u FROM User u WHERE u.phone = :identifier OR LOWER(u.email) = LOWER(:identifier)")
    Optional<User> findByIdentifier(String identifier);

    Optional<User> findByEmailVerificationToken(String token);

    boolean existsByEmail(String email);

	boolean existsByusername(String username);

	boolean existsByUsername(String normalizedUsername);
	Optional<User> findByBotleagueId(String botleagueId);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "u.phone LIKE CONCAT('%', :q, '%') OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.botleagueId) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<User> searchUsers(@Param("q") String query, Pageable pageable);

}