package com.botleague.backend.auth.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.auth.dto.*;
import com.botleague.backend.auth.service.AuthService;
import com.botleague.backend.common.security.JwtService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
@RestController
@RequestMapping("/api/auth")
public class AuthController {

	@Value("${app.cookie.secure:false}")
	private boolean cookieSecure;
    private static final String REFRESH_COOKIE = "refresh_token";
    private static final int REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService  = jwtService;
    }

    // ================= REGISTER =================

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request) {

        AuthTokensDTO tokens = authService.register(request);
        return buildTokenResponse(tokens);
    }

    // ================= LOGIN =================

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request) {

        AuthTokensDTO tokens = authService.login(request);
        return buildTokenResponse(tokens);
    }

    // ================= REFRESH =================
    // Client calls this when the 15-min access token expires.
    // Reads the refresh token from the httpOnly cookie, rotates it,
    // and returns a fresh access token + new refresh cookie.

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refresh(HttpServletRequest request) {

        String refreshToken = extractCookie(request, REFRESH_COOKIE);
        AuthTokensDTO tokens = authService.refresh(refreshToken);
        return buildTokenResponse(tokens);
    }

    // ================= LOGOUT =================
    // Revokes the refresh token in Postgres and clears the cookie.

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {

        String refreshToken = extractCookie(request, REFRESH_COOKIE);
        authService.logout(refreshToken);

        // Clear the cookie by setting maxAge=0
        ResponseCookie cleared = buildCookie("", 0);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cleared.toString())
                .build();
    }

    // ================= GET CURRENT USER =================
    // The JwtAuthenticationFilter sets userId (String) as the principal,
    // NOT the User entity. This avoids a DB hit on every authenticated request.

    @GetMapping("/me")
    public ResponseEntity<MeResponseDTO> me(Authentication authentication) {

        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = (String) authentication.getPrincipal();
        MeResponseDTO response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(response);
    }

    // ================= FORGOT PASSWORD =================

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequestDTO request) {

        authService.forgotPassword(request);
        // Always same response — never reveal whether the account exists
        return ResponseEntity.ok("If account exists, reset instructions sent");
    }

    // ================= RESET PASSWORD =================

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request) {

        authService.resetPassword(request);
        return ResponseEntity.ok("Password reset successful");
    }

    // ================= CHANGE PASSWORD =================

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @Valid @RequestBody ChangePasswordRequestDTO request,
            Authentication authentication) {

        String userId = (String) authentication.getPrincipal();
        authService.changePassword(request, userId);
        return ResponseEntity.ok("Password changed successfully");
    }

    // ================= HELPERS =================

    /**
     * Builds the response for register/login/refresh:
     *   - Access token + botleagueId in the JSON body (SPA keeps access token in memory)
     *   - Refresh token in an httpOnly Secure cookie (JS can't read it = XSS-safe)
     */
    private ResponseEntity<AuthResponseDTO> buildTokenResponse(AuthTokensDTO tokens) {

        ResponseCookie cookie = buildCookie(tokens.getRefreshToken(), REFRESH_MAX_AGE);

        AuthResponseDTO body = new AuthResponseDTO(
                tokens.getAccessToken(),
                tokens.getBotleagueId(),
                jwtService.getAccessTtlSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    private ResponseCookie buildCookie(String value, long maxAgeSeconds) {
       
		return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "Strict" : "Lax")
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}