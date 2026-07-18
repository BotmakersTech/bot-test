package com.botleague.backend.common.security;

import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.botleague.backend.common.exception.ApiException;

import jakarta.annotation.PostConstruct;

/**
 * Wraps BCrypt so that no more than N hashes run at once. BCrypt is CPU-heavy by
 * design; on a 2-core box an unbounded login storm would peg both cores and stall
 * everything else (including cheap JWT verification). The semaphore makes excess
 * requests wait briefly, then fail fast with 429 instead of degrading the whole
 * service.
 */
@Component
public class PasswordHasher {

    private final PasswordEncoder encoder;
    private final Semaphore semaphore;

    public PasswordHasher(
            PasswordEncoder encoder,
            @Value("${security.bcrypt.max-concurrent-hashes:2}") int maxConcurrent) {
        this.encoder = encoder;
        this.semaphore = new Semaphore(maxConcurrent, true); // fair
    }

    // Computed once at startup — a fixed BCrypt hash that no real password
    // will ever match, used purely to burn the same CPU time a real
    // verification would cost. See matchesDummy() below.
    private String dummyHash;

    @PostConstruct
    void initDummyHash() {
        dummyHash = encoder.encode("timing-safety-dummy-password");
    }

    public String hash(String raw) {
        return withPermit(() -> encoder.encode(raw));
    }

    public boolean matches(String raw, String hash) {
        // BCrypt verification costs the same as hashing, so bound it too.
        return withPermit(() -> encoder.matches(raw, hash));
    }

    /**
     * Call this instead of matches() when the identifier being logged in with
     * doesn't correspond to any real user. Login used to skip BCrypt entirely
     * in that case, making a non-existent phone/email respond measurably
     * faster than a real one with a wrong password — an account-enumeration
     * timing channel. Always returns false.
     */
    public boolean matchesDummy(String raw) {
        matches(raw, dummyHash);
        return false;
    }

    private <T> T withPermit(java.util.function.Supplier<T> work) {
        boolean acquired = false;
        try {
            acquired = semaphore.tryAcquire(2, TimeUnit.SECONDS);
            if (!acquired) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Server busy, try again");
            }
            return work.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Interrupted");
        } finally {
            if (acquired) {
                semaphore.release();
            }
        }
    }
}