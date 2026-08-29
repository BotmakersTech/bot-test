package com.botleague.backend.common.security;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.InputStreamReader;

/**
 * In-memory token-bucket rate limiting (Bucket4j). This is the CORRECT tool for a
 * single server -- a distributed limiter would require the Redis we don't have.
 *
 * Two independent buckets guard every protected path: one keyed by client IP,
 * one keyed by the account identifier in the request body (phone/email) when
 * present. Both maps are bounded by a simple size cap so neither can grow
 * unbounded under a spray attack. The account-keyed bucket is what stops a
 * distributed attacker from bypassing the IP bucket by rotating source IPs
 * against a single victim account.
 *
 * Add dependency: com.bucket4j:bucket4j_jdk17-core (8.x)
 */
@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_BUCKETS = 100_000;

    // Matches the first "identifier"/"phone"/"email" string field in a JSON
    // body — good enough to key a rate-limit bucket without needing to know
    // each endpoint's exact DTO shape.
    private static final Pattern ACCOUNT_FIELD =
            Pattern.compile("\"(identifier|phone|email)\"\\s*:\\s*\"([^\"]*)\"");
    private static final int MAX_BODY_PEEK_BYTES = 8192;
    // Every rate-limited path is a small auth/OTP JSON body — real file
    // uploads never transit this app (presigned direct-to-R2). A generous
    // cap well above any real request here, so this can't be turned into a
    // memory-exhaustion vector by POSTing an oversized body.
    private static final int MAX_BUFFER_BYTES = 1_048_576; // 1 MiB

    private final Map<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> accountBuckets = new ConcurrentHashMap<>();

    private final int loginPerMin;
    private final int forgotPerMin;
    private final int otpPerMin;
    private final int resetPasswordPerMin;
    private final int registerPerMin;
    private final int sendOtpPerMin;
    private final int resendOtpPerMin;
    private final int uploadUrlPerMin;
    private final int certificateVerifyPerMin;
    private final int googleSigninPerMin;
    private final int selectRolePerMin;
    private final int verifyPhonePerMin;
    private final int guardianOtpPerMin;

    public RateLimitingFilter(
            @Value("${rate-limit.login-per-minute:5}") int loginPerMin,
            @Value("${rate-limit.forgot-password-per-minute:3}") int forgotPerMin,
            @Value("${rate-limit.otp-per-minute:5}") int otpPerMin,
            @Value("${rate-limit.reset-password-per-minute:3}") int resetPasswordPerMin,
            @Value("${rate-limit.register-per-minute:5}") int registerPerMin,
            @Value("${rate-limit.send-otp-per-minute:10}") int sendOtpPerMin,
            @Value("${rate-limit.resend-otp-per-minute:5}") int resendOtpPerMin,
            @Value("${rate-limit.upload-url-per-minute:20}") int uploadUrlPerMin,
            @Value("${rate-limit.certificate-verify-per-minute:30}") int certificateVerifyPerMin,
            @Value("${rate-limit.google-signin-per-minute:10}") int googleSigninPerMin,
            @Value("${rate-limit.select-role-per-minute:5}") int selectRolePerMin,
            @Value("${rate-limit.verify-phone-per-minute:5}") int verifyPhonePerMin,
            @Value("${rate-limit.guardian-otp-per-minute:5}") int guardianOtpPerMin) {
        this.loginPerMin = loginPerMin;
        this.forgotPerMin = forgotPerMin;
        this.otpPerMin = otpPerMin;
        this.resetPasswordPerMin = resetPasswordPerMin;
        this.registerPerMin = registerPerMin;
        this.sendOtpPerMin = sendOtpPerMin;
        this.resendOtpPerMin = resendOtpPerMin;
        this.uploadUrlPerMin = uploadUrlPerMin;
        this.certificateVerifyPerMin = certificateVerifyPerMin;
        this.googleSigninPerMin = googleSigninPerMin;
        this.selectRolePerMin = selectRolePerMin;
        this.verifyPhonePerMin = verifyPhonePerMin;
        this.guardianOtpPerMin = guardianOtpPerMin;
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

        String ipKey = ClientIpResolver.resolve(request) + ":" + request.getRequestURI();
        if (!tryConsume(ipBuckets, ipKey, limit)) {
            tooManyRequests(response);
            return;
        }

        // Peeking the body means downstream (Spring MVC's Jackson converter)
        // needs its own re-readable copy — wrap unconditionally for JSON POSTs
        // on protected paths so the body is only ever buffered once here.
        // Every one of these paths is a small auth/OTP JSON body (actual file
        // uploads go straight to R2 via a presigned URL, never through this
        // app) — MAX_BUFFER_BYTES rejects anything larger outright rather
        // than buffering it, so this can't become a memory-exhaustion vector.
        HttpServletRequest forwarded = request;
        String accountId = null;
        if ("POST".equalsIgnoreCase(request.getMethod())) {
            CachedBodyRequestWrapper cached;
            try {
                cached = new CachedBodyRequestWrapper(request);
            } catch (BodyTooLargeException e) {
                response.setStatus(413); // Content Too Large
                return;
            }
            forwarded = cached;
            accountId = extractAccountId(cached.getCachedBody());
        }

        if (accountId != null) {
            String accountKey = accountId + ":" + request.getRequestURI();
            if (!tryConsume(accountBuckets, accountKey, limit)) {
                tooManyRequests(response);
                return;
            }
        }

        chain.doFilter(forwarded, response);
    }

    private boolean tryConsume(Map<String, Bucket> buckets, String key, int limit) {
        Bucket bucket = buckets.computeIfAbsent(key, k -> {
            if (buckets.size() > MAX_BUCKETS) {
                evictHalf(buckets);
            }
            return newBucket(limit);
        });
        return bucket.tryConsume(1);
    }

    private void tooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Too many requests, slow down\"}");
    }

    private String extractAccountId(byte[] body) {
        if (body == null || body.length == 0) return null;
        String json = new String(body, 0, Math.min(body.length, MAX_BODY_PEEK_BYTES), StandardCharsets.UTF_8);
        Matcher m = ACCOUNT_FIELD.matcher(json);
        if (m.find()) {
            String value = m.group(2).trim().toLowerCase();
            return value.isEmpty() ? null : value;
        }
        return null;
    }

    private Integer limitFor(String uri) {
        if (uri.endsWith("/auth/login"))           return loginPerMin;
        if (uri.endsWith("/auth/register"))        return registerPerMin;
        if (uri.endsWith("/auth/forgot-password")) return forgotPerMin;
        if (uri.endsWith("/auth/reset-password"))  return resetPasswordPerMin;
        if (uri.endsWith("/auth/send-otp"))        return sendOtpPerMin;
        if (uri.endsWith("/auth/verify-otp"))      return otpPerMin;
        if (uri.endsWith("/auth/resend-otp"))      return resendOtpPerMin;
        if (uri.endsWith("/auth/google"))          return googleSigninPerMin;
        if (uri.endsWith("/auth/select-role"))     return selectRolePerMin;
        if (uri.endsWith("/profile/verify-phone")) return verifyPhonePerMin;
        if (uri.endsWith("/guardian/verify-otp"))  return guardianOtpPerMin;
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
    private void evictHalf(Map<String, Bucket> buckets) {
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

    /** Thrown by CachedBodyRequestWrapper when a body exceeds MAX_BUFFER_BYTES. */
    private static final class BodyTooLargeException extends IOException {
    }

    /**
     * Buffers the request body once so this filter can peek it for an
     * account identifier while leaving it fully re-readable for Spring MVC's
     * own body parsing further down the chain (both getInputStream() and
     * getReader() are overridden — Jackson's converter may use either).
     */
    private static final class CachedBodyRequestWrapper extends HttpServletRequestWrapper {

        private final byte[] cachedBody;

        CachedBodyRequestWrapper(HttpServletRequest request) throws IOException {
            super(request);
            try (var in = request.getInputStream()) {
                byte[] buffer = in.readNBytes(MAX_BUFFER_BYTES + 1);
                if (buffer.length > MAX_BUFFER_BYTES) {
                    throw new BodyTooLargeException();
                }
                this.cachedBody = buffer;
            }
        }

        byte[] getCachedBody() {
            return cachedBody;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream byteStream = new ByteArrayInputStream(cachedBody);
            return new ServletInputStream() {
                @Override
                public int read() {
                    return byteStream.read();
                }

                @Override
                public boolean isFinished() {
                    return byteStream.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener readListener) {
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }
    }
}
