package com.botleague.backend.common.security;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * In-memory token-bucket rate limiting (Bucket4j). This is the CORRECT tool for a
 * single server -- a distributed limiter would require the Redis we don't have.
 *
 * Buckets are keyed by client IP + sensitive path. The map is bounded by a simple
 * size cap so it can't grow unbounded under a spray attack.
 *
 * Add dependency: com.bucket4j:bucket4j_jdk17-core (8.x)
 */
@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_BUCKETS = 100_000;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private final int loginPerMin;
    private final int forgotPerMin;
    private final int otpPerMin;
    private final int registerPerMin;
    private final int sendOtpPerMin;
    private final int resendOtpPerMin;
    private final int uploadUrlPerMin;
    private final int certificateVerifyPerMin;

    public RateLimitingFilter(
            @Value("${rate-limit.login-per-minute:5}") int loginPerMin,
            @Value("${rate-limit.forgot-password-per-minute:3}") int forgotPerMin,
            @Value("${rate-limit.otp-per-minute:5}") int otpPerMin,
            @Value("${rate-limit.register-per-minute:5}") int registerPerMin,
            @Value("${rate-limit.send-otp-per-minute:10}") int sendOtpPerMin,
            @Value("${rate-limit.resend-otp-per-minute:5}") int resendOtpPerMin,
            @Value("${rate-limit.upload-url-per-minute:20}") int uploadUrlPerMin,
            @Value("${rate-limit.certificate-verify-per-minute:30}") int certificateVerifyPerMin) {
        this.loginPerMin = loginPerMin;
        this.forgotPerMin = forgotPerMin;
        this.otpPerMin = otpPerMin;
        this.registerPerMin = registerPerMin;
        this.sendOtpPerMin = sendOtpPerMin;
        this.resendOtpPerMin = resendOtpPerMin;
        this.uploadUrlPerMin = uploadUrlPerMin;
        this.certificateVerifyPerMin = certificateVerifyPerMin;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        Integer limit = limitFor(request.getRequestURI());
        if (limit == null) {
            chain.doFilter(request, response); // not a protected path
            return;
        }

        String key = ClientIpResolver.resolve(request) + ":" + request.getRequestURI();
        Bucket bucket = buckets.computeIfAbsent(key, k -> {
            if (buckets.size() > MAX_BUCKETS) {
                evictHalf(); // bounded guard against memory blowup
            }
            return newBucket(limit);
        });

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many requests, slow down\"}");
        }
    }

    private Integer limitFor(String uri) {
        if (uri.endsWith("/auth/login"))           return loginPerMin;
        if (uri.endsWith("/auth/register"))        return registerPerMin;
        if (uri.endsWith("/auth/forgot-password")) return forgotPerMin;
        if (uri.endsWith("/auth/send-otp"))        return sendOtpPerMin;
        if (uri.endsWith("/auth/verify-otp"))      return otpPerMin;
        if (uri.endsWith("/auth/resend-otp"))      return resendOtpPerMin;
        // Presigned-upload-URL minting — every one of these was previously
        // completely unrated, including two that were also unauthenticated
        // (see SecurityConfig / EventSponsorController / SportSponsorController).
        // Now auth+ownership-gated too, but still worth bounding: each call is
        // effectively a free write into R2 storage/egress cost.
        if (uri.endsWith("/upload-url"))                        return uploadUrlPerMin;
        if (uri.contains("/upload/") && uri.endsWith("/logo"))  return uploadUrlPerMin;
        // Public, unauthenticated QR/link verification — otherwise a free,
        // unbounded lookup an attacker could hammer to enumerate certificate numbers.
        if (uri.contains("/certificates/verify/"))              return certificateVerifyPerMin;
        return null;
    }

    // No per-entry last-access tracking is kept here (would need extra
    // bookkeeping on every request just to support this rare path), so this
    // can't do true LRU eviction. But dropping roughly half the map instead
    // of ALL of it means a burst that pushes us over MAX_BUCKETS can no
    // longer zero out every other client's consumed-token state in one shot
    // — previously that made the overflow guard itself a rate-limit-bypass
    // trigger once an attacker could cheaply inflate the bucket count (see
    // clientIp() — that spoofing path is now closed, so reaching this at all
    // requires genuinely distinct source IPs, not just forged headers).
    private void evictHalf() {
        int target = MAX_BUCKETS / 2;
        var it = buckets.keySet().iterator();
        while (buckets.size() > target && it.hasNext()) {
            it.next();
            it.remove();
        }
    }

    private Bucket newBucket(int perMinute) {
        Bandwidth limit = Bandwidth.classic(perMinute, Refill.greedy(perMinute, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }
}