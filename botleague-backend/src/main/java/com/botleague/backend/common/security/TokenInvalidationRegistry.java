package com.botleague.backend.common.security;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * In-memory "revoke every access token issued before this instant" registry
 * — the access-token counterpart to RefreshTokenService's DB-backed revocation.
 * Access tokens are deliberately stateless (see JwtService/JwtAuthenticationFilter
 * javadocs: no DB lookup per request, single server, no Redis), so a suspend/
 * demote/role-change can't simply delete a row — this is the equivalent
 * in-memory mechanism, consistent with RateLimitingFilter's same single-instance
 * constraint. Entries are one per account ever actioned on, not per request, so
 * this can't grow with traffic the way a request-keyed cache could.
 */
@Component
public class TokenInvalidationRegistry {

    private final Map<UUID, Instant> invalidatedBefore = new ConcurrentHashMap<>();

    /** Call whenever an account's status/roles change in a way that should kill its live tokens. */
    public void invalidateTokensBefore(UUID userId, Instant instant) {
        invalidatedBefore.merge(userId, instant, (existing, incoming) -> incoming.isAfter(existing) ? incoming : existing);
    }

    public void invalidateNow(UUID userId) {
        invalidateTokensBefore(userId, Instant.now());
    }

    /** True if a token issued at tokenIssuedAt for this user is still trusted. */
    public boolean isValid(UUID userId, Instant tokenIssuedAt) {
        Instant cutoff = invalidatedBefore.get(userId);
        return cutoff == null || !tokenIssuedAt.isBefore(cutoff);
    }
}
