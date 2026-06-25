// common/exception/Exceptions.java  (small, specific subclasses)
package com.botleague.backend.common.exception;

import org.springframework.http.HttpStatus;

public final class Exceptions {
    private Exceptions() {}

    public static class ConflictException extends ApiException {
        public ConflictException(String m) { super(HttpStatus.CONFLICT, m); }
    }
    public static class UnauthorizedException extends ApiException {
        public UnauthorizedException(String m) { super(HttpStatus.UNAUTHORIZED, m); }
    }
    public static class NotFoundException extends ApiException {
        public NotFoundException(String m) { super(HttpStatus.NOT_FOUND, m); }
    }
    public static class BadRequestException extends ApiException {
        public BadRequestException(String m) { super(HttpStatus.BAD_REQUEST, m); }
    }
    public static class TooManyRequestsException extends ApiException {
        public TooManyRequestsException(String m) { super(HttpStatus.TOO_MANY_REQUESTS, m); }
    }
    public static class LockedException extends ApiException {
        public LockedException(String m) { super(HttpStatus.LOCKED, m); }
    }
}