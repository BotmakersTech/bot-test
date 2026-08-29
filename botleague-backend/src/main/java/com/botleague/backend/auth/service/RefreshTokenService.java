package com.botleague.backend.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.auth.entity.RefreshToken;
import com.botleague.backend.auth.repository.RefreshTokenRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.security.TokenInvalidationRegistry;

/**
 * Opaque refresh tokens stored hashed in Postgres. This is how we get logout and
 * revocation without Redis. The raw token is returned to the client exactly once;
 * we keep only its SHA-256 hash.
 *
 * Rotation: every refresh issues a brand new token and revokes the old one. If a
 * client ever presents an already-revoked token, we treat it as theft and revoke
 * the user's entire token family.
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final long ttlDays;
    private final SecureRandom random = new SecureRandom();
    private final TokenInvalidationRegistry tokenInvalidationRegistry;
    private final AuditLogService auditLogService;

    public RefreshTokenService(
            RefreshTokenRepository repository,
            @Value("${security.refresh.ttl-days:30}") long ttlDays,
            TokenInvalidationRegistry tokenInvalidationRegistry,
            AuditLogService auditLogService) {
        this.repository = repository;
        this.ttlDays = ttlDays;
        this.tokenInvalidationRegistry = tokenInvalidationRegistry;
        this.auditLogService = auditLogService;
    }

    /** Returns the RAW token (give to client once); stores only its hash. */
    @Transactional
    public String issue(UUID userId) {
        String raw = randomToken();
        RefreshToken entity = new RefreshToken();
        entity.setUserId(userId);
        entity.setTokenHash(sha256(raw));
        entity.setExpiresAt(LocalDateTime.now().plusDays(ttlDays));
        repository.save(entity);
        return raw;
    }

    /** Validates + rotates. Returns the userId and a fresh raw token. */
    @Transactional
    public Rotation rotate(String rawToken) {
        RefreshToken existing = repository.findByTokenHash(sha256(rawToken))
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        if (existing.isRevoked()) {
            // Reuse of a revoked token => likely theft. Burn the whole family,
            // and any live access token too — a stolen refresh token means the
            // access token it was paired with may be compromised as well.
            repository.revokeAllForUser(existing.getUserId());
            tokenInvalidationRegistry.invalidateNow(existing.getUserId());
            auditLogService.log("REFRESH_TOKEN_REUSE_DETECTED", "USER", existing.getUserId(),
                    existing.getUserId().toString(), null, null,
                    "Revoked refresh token presented again — entire token family revoked");
            throw ApiException.unauthorized("Refresh token reuse detected");
        }
        if (existing.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw ApiException.unauthorized("Refresh token expired");
        }

        existing.setRevoked(true);
        repository.save(existing);

        String newRaw = issue(existing.getUserId());
        return new Rotation(existing.getUserId(), newRaw);
    }

    @Transactional
    public void revoke(String rawToken) {
        repository.findByTokenHash(sha256(rawToken)).ifPresent(t -> {
            t.setRevoked(true);
            repository.save(t);
        });
    }

    @Transactional
    public void revokeAll(UUID userId) {
        repository.revokeAllForUser(userId);
    }

    // helpers --------------------------------------------------------------

    private String randomToken() {
        byte[] bytes = new byte[32]; // 256 bits
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : digest) {
                sb.append(Character.forDigit((b >> 4) & 0xF, 16));
                sb.append(Character.forDigit(b & 0xF, 16));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public record Rotation(UUID userId, String rawToken) {}
}