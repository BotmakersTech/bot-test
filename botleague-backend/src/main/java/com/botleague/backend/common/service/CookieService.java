package com.botleague.backend.common.service;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletResponse;

@Service
public class CookieService {

    public static void addJwtCookie(HttpServletResponse response, String token) {

        ResponseCookie cookie = ResponseCookie.from("token", token)
                .httpOnly(true)                 // 🔐 prevent JS access
                .secure(false)                 // ⚠️ true in production (HTTPS)
                .path("/")                     // available for all endpoints
                .maxAge(7 * 24 * 60 * 60)     // 7 days
                .sameSite("Lax")             // 🔥 REQUIRED for cross-origin
                .build();

        response.setHeader("Set-Cookie", cookie.toString());
    }

    public static void clearJwtCookie(HttpServletResponse response) {

        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)                    // delete immediately
                .sameSite("None")
                .build();

        response.setHeader("Set-Cookie", cookie.toString());
    }
}