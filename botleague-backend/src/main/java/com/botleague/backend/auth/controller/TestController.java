package com.botleague.backend.auth.controller;

import java.time.Duration;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.botleague.backend.common.service.RateLimitService;

import io.github.bucket4j.Bucket;

@RestController
class TestController {

    private final RateLimitService rateLimitService;

    public TestController(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @GetMapping("/test")
    public String test() {
        Bucket bucket = rateLimitService.resolveBucket("user1", 3, 3, Duration.ofMinutes(1));

        if (bucket.tryConsume(1)) {
            return "OK";
        }
        throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
    }
}
