package com.botleague.backend.auth.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Stores hashed refresh tokens in Postgres. This is how we get logout,
 * revocation, and theft detection without Redis.
 *
 * Raw token -> SHA-256 hash -> stored here. The raw value lives only in the
 * client's httpOnly cookie. If this table leaks, attackers get useless hashes.
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
        @Index(name = "idx_refresh_token_hash", columnList = "token_hash"),
        @Index(name = "idx_refresh_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
public class RefreshToken {

    // =========================
    // PRIMARY KEY
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // =========================
    // WHO OWNS THIS TOKEN
    // =========================

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // =========================
    // THE HASHED TOKEN
    // =========================
    // We store ONLY the SHA-256 hash, never the raw value.
    // Lookup: client sends raw token -> we hash it -> query this column.

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    // =========================
    // EXPIRY (30 days default)
    // =========================
    // TokenCleanupJob deletes rows past this date every hour.

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // =========================
    // REVOCATION FLAG
    // =========================
    // Set to TRUE when:
    //   1. Token is used (rotation: old one dies, new one issued)
    //   2. User logs out
    //   3. User changes password -> revokeAllForUser()
    //
    // If a client presents a token where revoked=TRUE, it means the token
    // was already used -> likely stolen -> we revoke ALL tokens for this user.

    @Column(nullable = false)
    private boolean revoked = false;

    // =========================
    // AUDIT
    // =========================

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
    
}