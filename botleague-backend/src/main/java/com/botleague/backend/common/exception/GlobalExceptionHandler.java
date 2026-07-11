package com.botleague.backend.common.exception;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Extends ResponseEntityExceptionHandler so Spring MVC infrastructure exceptions
 * (405, 404, 400 from binding) are handled here and returned in a consistent JSON
 * envelope instead of the default HTML error page or a fallback 500.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ---- Business / validation exceptions ----

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException ex) {
        return build(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(IllegalStateException ex) {
        return build(HttpStatus.CONFLICT, ex.getMessage());
    }

    // Covers both the older AccessDeniedException and Spring Security 6's
    // AuthorizationDeniedException (thrown by @PreAuthorize denials) — both
    // extend this type. Without this handler these fell through to the
    // catch-all below and surfaced as a misleading 500.
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return build(HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
    }

    // ---- Spring MVC infrastructure exceptions (override parent) ----

    @Override
    @NonNull
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            @NonNull MethodArgumentNotValidException ex,
            @NonNull HttpHeaders headers,
            @NonNull HttpStatusCode status,
            @NonNull WebRequest request
    ) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return buildObject(HttpStatus.BAD_REQUEST, message);
    }

    @Override
    @NonNull
    protected ResponseEntity<Object> handleExceptionInternal(
            @NonNull Exception ex,
            Object body,
            @NonNull HttpHeaders headers,
            @NonNull HttpStatusCode status,
            @NonNull WebRequest request
    ) {
        // Routes all other Spring MVC infra exceptions (405, 404, 415, …)
        // through our JSON envelope instead of the default error body.
        return buildObject(HttpStatus.resolve(status.value()), ex.getMessage());
    }

    // ---- Catch-all (genuine unexpected errors only) ----

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    }

    // ---- Helpers ----

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String message) {
        HttpStatus s = status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR;
        Map<String, Object> body = Map.of(
                "timestamp", Instant.now().toString(),
                "status",    s.value(),
                "error",     s.getReasonPhrase(),
                "message",   message != null ? message : s.getReasonPhrase());
        return ResponseEntity.status(s).body(body);
    }

    private ResponseEntity<Object> buildObject(HttpStatus status, String message) {
        HttpStatus s = status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR;
        Map<String, Object> body = Map.of(
                "timestamp", Instant.now().toString(),
                "status",    s.value(),
                "error",     s.getReasonPhrase(),
                "message",   message != null ? message : s.getReasonPhrase());
        return ResponseEntity.status(s).body(body);
    }
}