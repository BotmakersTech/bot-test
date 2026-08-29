package com.botleague.backend.common.security;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Authenticates every request from the access token alone -- no DB lookup. This
 * is what keeps authenticated traffic cheap on 2 cores. The userId becomes the
 * Spring Security principal; controllers read it via the Authentication.
 *
 * The one exception is TokenInvalidationRegistry — an in-memory (not DB) check
 * against a small set of "tokens issued before X are revoked" markers, so a
 * suspend/demote/role-change (see UserManagementService, AuthService.selectRole)
 * takes effect immediately instead of waiting out the access token's TTL.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenInvalidationRegistry tokenInvalidationRegistry;

    public JwtAuthenticationFilter(JwtService jwtService, TokenInvalidationRegistry tokenInvalidationRegistry) {
        this.jwtService = jwtService;
        this.tokenInvalidationRegistry = tokenInvalidationRegistry;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.isValid(token)) {
                String userId = jwtService.extractUserId(token);
                boolean stillValid = true;
                try {
                    stillValid = tokenInvalidationRegistry.isValid(
                            UUID.fromString(userId), jwtService.extractIssuedAt(token));
                } catch (IllegalArgumentException e) {
                    stillValid = false;
                }
                if (stillValid) {
                    List<GrantedAuthority> authorities = jwtService.extractRoles(token).stream()
                            .map(r -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + r))
                            .collect(Collectors.toList());
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }
        chain.doFilter(request, response);
    }
}