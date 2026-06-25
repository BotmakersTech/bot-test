package com.botleague.backend.common.security;

import java.util.UUID;

import org.springframework.security.core.Authentication;

import com.botleague.backend.common.exception.ApiException;

/**
 * Utility to extract the current authenticated user's UUID from Spring Security's
 * Authentication object.
 *
 * JwtAuthenticationFilter stores the userId string as the principal, so every
 * controller/service that needs the caller's UUID should use this helper instead
 * of repeating the cast inline.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the UUID of the currently authenticated user.
     *
     * @throws ApiException (401) if authentication is null or the principal is not a String UUID.
     */
    public static UUID currentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw ApiException.unauthorized("Authentication required");
        }
        try {
            return UUID.fromString((String) authentication.getPrincipal());
        } catch (ClassCastException | IllegalArgumentException e) {
            throw ApiException.unauthorized("Invalid authentication principal");
        }
    }
}
