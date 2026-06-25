package com.botleague.backend.common.service;

import io.github.bucket4j.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key, int capacity, int refillTokens, Duration duration) {

        return cache.computeIfAbsent(key, k -> 
            Bucket.builder()
                    .addLimit(Bandwidth.classic(capacity,
                            Refill.intervally(refillTokens, duration)))
                    .build()
        );
    }
}
