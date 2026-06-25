package com.botleague.backend.common.security;



import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Service;

@Service
public class AuthCookieService {

    private static final String COOKIE_NAME = "token";
    private static final int COOKIE_EXPIRY = 24 * 60 * 60; // 1 day

    public void addJwtCookie(HttpServletResponse response, String token) {

        Cookie cookie = new Cookie(COOKIE_NAME, token);

        cookie.setHttpOnly(true);
        cookie.setSecure(true);      // true in production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_EXPIRY);

        response.addCookie(cookie);
    }

    public void clearCookie(HttpServletResponse response) {

        Cookie cookie = new Cookie(COOKIE_NAME, null);

        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
    }
}
