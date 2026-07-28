package com.botleague.backend.news.controller;

import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.news.dto.NewsRequest;
import com.botleague.backend.news.dto.NewsResponse;
import com.botleague.backend.news.dto.NewsUpdateRequest;
import com.botleague.backend.news.service.NewsService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Platform-wide News — Admin-only authoring (no owned resource to scope to,
 * unlike event-level Announcement, so a coarse role check is the whole
 * authorization story here, matching AdminNotificationController).
 */
@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService newsService;
    private final AuthorizationService authorizationService;
    private final FileKeyService fileKeyService;
    private final UploadService uploadService;

    public NewsController(
            NewsService newsService,
            AuthorizationService authorizationService,
            FileKeyService fileKeyService,
            UploadService uploadService) {
        this.newsService = newsService;
        this.authorizationService = authorizationService;
        this.fileKeyService = fileKeyService;
        this.uploadService = uploadService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<NewsResponse> create(
            @Valid @RequestBody NewsRequest req,
            Authentication auth) {

        UUID createdBy = extractUserId(auth);
        authorizationService.assertIsPlatformAdmin(createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(newsService.create(req, createdBy));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Map<String, Object>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<NewsResponse> result = newsService.listAll(page, size);
        return ResponseEntity.ok(pagedBody(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NewsResponse> getById(@PathVariable UUID id, Authentication auth) {
        UUID callerId = extractUserId(auth);
        boolean isAdmin = authorizationService.isPlatformAdmin(callerId);
        return ResponseEntity.ok(newsService.getForCaller(id, callerId, isAdmin));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<NewsResponse> update(
            @PathVariable UUID id,
            @RequestBody NewsUpdateRequest req,
            Authentication auth) {

        authorizationService.assertIsPlatformAdmin(extractUserId(auth));
        return ResponseEntity.ok(newsService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        authorizationService.assertIsPlatformAdmin(extractUserId(auth));
        newsService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/upload-url")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<UploadResponse> getUploadUrl(
            @RequestParam String fileType,
            @RequestParam long fileSize,
            Authentication auth) {

        authorizationService.assertIsPlatformAdmin(extractUserId(auth));
        String key = fileKeyService.generateNewsAttachmentKey(fileType);
        return ResponseEntity.ok(uploadService.generateUploadUrl(key, fileType, fileSize));
    }

    /**
     * GET /api/news/feed?page=0&size=20
     * The competitor-facing browse list — server derives the caller's own
     * eligibility, no client-supplied filter params accepted.
     */
    @GetMapping("/feed")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        UUID callerId = extractUserId(auth);
        Page<NewsResponse> result = newsService.getPublicFeed(callerId, page, size);
        return ResponseEntity.ok(pagedBody(result));
    }

    private Map<String, Object> pagedBody(Page<NewsResponse> result) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", result.getContent());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        return response;
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
