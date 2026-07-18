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

    public RateLimitingFilter(
            @Value("${rate-limit.login-per-minute:5}") int loginPerMin,
            @Value("${rate-limit.forgot-password-per-minute:3}") int forgotPerMin,
            @Value("${rate-limit.otp-per-minute:5}") int otpPerMin,
            @Value("${rate-limit.register-per-minute:5}") int registerPerMin,
            @Value("${rate-limit.send-otp-per-minute:10}") int sendOtpPerMin,
            @Value("${rate-limit.resend-otp-per-minute:5}") int resendOtpPerMin,
            @Value("${rate-limit.upload-url-per-minute:20}") int uploadUrlPerMin) {
        this.loginPerMin = loginPerMin;
        this.forgotPerMin = forgotPerMin;
        this.otpPerMin = otpPerMin;
        this.registerPerMin = registerPerMin;
        this.sendOtpPerMin = sendOtpPerMin;
        this.resendOtpPerMin = resendOtpPerMin;
        this.uploadUrlPerMin = uploadUrlPerMin;
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

        String key = clientIp(request) + ":" + request.getRequestURI();
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

    private String clientIp(HttpServletRequest request) {
        // nginx.conf sets `X-Real-IP: $remote_addr` unconditionally — it always
        // OVERWRITES this header with what it actually saw on the socket, so a
        // client-supplied X-Real-IP can never survive the hop. That makes it
        // the only header here a client can't spoof; prefer it.
        //
        // X-Forwarded-For is set via $proxy_add_x_forwarded_for, which APPENDS
        // to whatever the client already sent rather than replacing it. Taking
        // the FIRST entry (as this used to) reads back the attacker's own
        // injected value; the LAST entry is the one nginx itself appended,
        // i.e. the real peer — but only because there is exactly one trusted
        // hop in front of this app (see nginx/botleague.conf). If a second
        // proxy/CDN is ever added in front of nginx, this must change to trust
        // the last-but-one entry instead.
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] hops = xff.split(",");
            return hops[hops.length - 1].trim();
        }

        return request.getRemoteAddr();
    }
}