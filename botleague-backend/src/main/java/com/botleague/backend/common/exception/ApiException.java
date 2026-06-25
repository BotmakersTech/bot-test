package com.botleague.backend.common.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    // ==================== FACTORY METHODS ====================
    // Every throw site in AuthService, OtpService, RefreshTokenService,
    // PasswordHasher, etc. calls one of these. If you remove any,
    // the project won't compile.

    /** 400 — malformed request, missing fields, expired token, bad OTP */
    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    /** 401 — wrong password, invalid/expired JWT, invalid refresh token */
    public static ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }

    /** 403 — account inactive, insufficient permissions */
    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message);
    }

    /** 404 — user not found, resource not found */
    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    /** 409 — duplicate registration (phone/email already exists) */
    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    /** 429 — rate limit hit, bcrypt semaphore full */
    public static ApiException tooManyRequests(String message) {
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, message);
    }
}