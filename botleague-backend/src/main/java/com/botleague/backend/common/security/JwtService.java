package com.botleague.backend.common.security;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;

/**
 * Stateless access tokens. Verification is a CPU-cheap HMAC check with NO
 * database lookup, which is what lets authenticated traffic scale on 2 cores.
 *
 * Add this dependency:
 *   io.jsonwebtoken:jjwt-api, jjwt-impl, jjwt-jackson  (0.12.x)
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTtlMillis;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.access-ttl-seconds:900}") long accessTtlSeconds) {

        // Secret is base64; must decode to >= 32 bytes for HS256.
        byte[] decoded = decode(secret);
        if (decoded.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 256 bits (32 bytes)");
        }
        this.key = Keys.hmacShaKeyFor(decoded);
        this.accessTtlMillis = accessTtlSeconds * 1000L;
    }

    public String generateAccessToken(String userId) {
        return generateAccessToken(userId, Collections.emptyList());
    }

    public String generateAccessToken(String userId, List<String> roles) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId)
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessTtlMillis))
                .signWith(key)
                .compact();
    }

    public long getAccessTtlSeconds() {
        return accessTtlMillis / 1000L;
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractUserId(String token) {
        return parse(token).getPayload().getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Object roles = parse(token).getPayload().get("roles");
        if (roles instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return Collections.emptyList();
    }

    private io.jsonwebtoken.Jws<Claims> parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }

    private static byte[] decode(String secret) {
        try {
            return Base64.getDecoder().decode(secret);
        } catch (IllegalArgumentException e) {
            // allow a raw (non-base64) secret as a fallback
            return secret.getBytes(StandardCharsets.UTF_8);
        }
    }
}