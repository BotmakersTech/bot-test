package com.botleague.backend.common.filter;

import io.github.bucket4j.*;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitFilter implements Filter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    // ================= BUCKET CONFIG =================

    private Bucket createOtpBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(3, Refill.greedy(4, Duration.ofMinutes(5))))
                .build();
    }

    private Bucket createLoginBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.greedy(6, Duration.ofMinutes(1))))
                .build();
    }

    private Bucket createDefaultBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1))))
                .build();
    }

    // ================= RESOLVE BUCKET =================

    private Bucket resolveBucket(String key, String path) {

        // simple memory protection
        if (cache.size() > 10000) {
            cache.clear();
        }

        return cache.computeIfAbsent(key + ":" + path, k -> {

            if (path.contains("/auth/send-otp")) {
                return createOtpBucket();
            }

            if (path.contains("/auth/verify-otp")) {
                return createOtpBucket();
            }

            if (path.contains("/auth/login")) {
                return createLoginBucket();
            }

            if (path.contains("/auth/register")) {
                return createLoginBucket();
            }

            if (path.contains("/auth/forgot-password")) {
                return createLoginBucket();
            }

            return createDefaultBucket();
        });
    }

    // ================= FILTER =================

    @Override
    public void doFilter(
            ServletRequest request,
            ServletResponse response,
            FilterChain chain
    ) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String ip = getClientIP(req);
        String path = req.getRequestURI();

        // 🔥 IMPORTANT: Add phone-based protection
        String phone = req.getParameter("phone");

        String key = ip;

        if (phone != null && !phone.isEmpty()) {
            key = ip + ":" + phone;
        }

        Bucket bucket = resolveBucket(key, path);

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("""
            {
              "error": "Too many requests Try After Some Time ",
              "status": 429
            }
            """);
        }
    }

    // ================= IP RESOLVER =================

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        return (xfHeader == null) ? request.getRemoteAddr() : xfHeader.split(",")[0];
    }
}