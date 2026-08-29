package com.botleague.backend.common.service;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.profile.dto.UploadResponse;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class UploadService {

    private static final Logger log = LoggerFactory.getLogger(UploadService.class);

    private final S3Presigner presigner;
    private final S3Client s3Client;

    @Value("${r2.bucket}")
    private String bucket;

    @Value("${r2.public-url}")
    private String publicBaseUrl;

    // Max allowed size (optional config) — images/logos/etc.
    @Value("${upload.max-size-bytes:52428800}") // default 50MB
    private long maxImageSize;

    // Video uploads (e.g. teaser videos) get a higher cap.
    @Value("${upload.video-max-size-bytes:524288000}") // default 500MB
    private long maxVideoSize;

    // Certificate template backgrounds — flat design assets, generous but bounded.
    @Value("${upload.certificate-template-max-size-bytes:26214400}") // default 25MB
    private long maxCertificateTemplateSize;

    public UploadService(S3Presigner presigner, S3Client s3Client) {
        this.presigner = presigner;
        this.s3Client = s3Client;
    }


    // =========================
    // GENERATE PRESIGNED URL
    // =========================
    public UploadResponse generateUploadUrl(String key, String contentType, long fileSize) {
    	
        // =========================
        // 1. Validate Input
        // =========================
        validateContentType(contentType);
        validateFileSize(fileSize, contentType);

      
        // =========================
        // 2. Build Put Request
        // =========================
        // Binding contentType + contentLength into the signed request means
        // the presigned URL only validates a PUT whose actual headers match
        // exactly what was declared here — previously neither was bound, so
        // a caller could request a URL for a 1KB PNG and then PUT an
        // arbitrarily large file of any type through it.
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(fileSize)
                .build();

        // =========================
        // 3. Presign Request
        // =========================
        PutObjectPresignRequest presignRequest =
                PutObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(10))
                        .putObjectRequest(putRequest)
                        .build();

        PresignedPutObjectRequest presignedRequest =
                presigner.presignPutObject(presignRequest);

        // =========================
        // 4. Return Response
        // =========================
        return new UploadResponse(
                presignedRequest.url().toString(),  // upload URL
                buildPublicUrl(key),                // public access URL
                key
        );
    }

    // =========================
    // CERTIFICATE TEMPLATE UPLOAD (separate from the generic method above —
    // that method's image/video-only whitelist is relied on by many other
    // features; templates additionally need PDF/PNG and get their own size cap).
    // =========================
    public UploadResponse generateCertificateTemplateUploadUrl(String key, String contentType, long fileSize) {

        validateCertificateTemplateContentType(contentType);
        validateCertificateTemplateFileSize(fileSize);

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(fileSize)
                .build();

        PutObjectPresignRequest presignRequest =
                PutObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(10))
                        .putObjectRequest(putRequest)
                        .build();

        PresignedPutObjectRequest presignedRequest =
                presigner.presignPutObject(presignRequest);

        return new UploadResponse(
                presignedRequest.url().toString(),
                buildPublicUrl(key),
                key
        );
    }

    private void validateCertificateTemplateContentType(String contentType) {
        if (contentType == null) {
            throw ApiException.badRequest("Content type is required");
        }
        // A template background is always a flat raster image — the renderer
        // draws it as the PDF page background and overlays text/QR on top of
        // it, so no PDF/SVG/animated format is accepted here.
        boolean allowed = contentType.equalsIgnoreCase("image/png")
                || contentType.equalsIgnoreCase("image/jpeg");
        if (!allowed) {
            throw ApiException.badRequest("Certificate templates must be PNG or JPEG");
        }
    }

    private void validateCertificateTemplateFileSize(long fileSize) {
        if (fileSize <= 0) {
            throw ApiException.badRequest("Invalid file size");
        }
        if (fileSize > maxCertificateTemplateSize) {
            throw ApiException.badRequest("File size exceeds limit of " + (maxCertificateTemplateSize / (1024 * 1024)) + "MB");
        }
    }

    // =========================
    // PUBLIC URL BUILDER
    // =========================
    private String buildPublicUrl(String key) {
        return publicBaseUrl + "/" + key;
    }

    /**
     * Deletes a previously-uploaded object from R2 — every generated key
     * includes a random UUID (see FileKeyService), so replacing/clearing a
     * media field always orphans the old object unless something explicitly
     * deletes it. Accepts either a raw key or the full public URL (different
     * call sites store one or the other) and never throws: cleanup here is
     * strictly best-effort and must never block the caller's real update.
     */
    public void deleteObject(String keyOrPublicUrl) {
        if (keyOrPublicUrl == null || keyOrPublicUrl.isBlank()) return;

        String key = keyOrPublicUrl;
        String prefix = publicBaseUrl + "/";
        if (key.startsWith(prefix)) {
            key = key.substring(prefix.length());
        }

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to delete orphaned R2 object key={}: {}", key, e.getMessage());
        }
    }

    // =========================
    // VALIDATIONS
    // =========================
    private void validateContentType(String contentType) {

        if (contentType == null) {
            throw ApiException.badRequest("Content type is required");
        }

        if (!(contentType.startsWith("image") || contentType.startsWith("video"))) {
            throw ApiException.badRequest("Only image and video uploads are allowed");
        }

        // SVG can embed <script>/event-handler attributes — if it's ever served
        // inline instead of as a forced download, that's stored XSS off the
        // public media CDN. Raster formats cover every real upload use case
        // here (logos, robot photos), so it's simplest to just disallow it.
        if (contentType.equalsIgnoreCase("image/svg+xml")) {
            throw ApiException.badRequest("SVG uploads are not allowed");
        }
    }

    private void validateFileSize(long fileSize, String contentType) {

        if (fileSize <= 0) {
            throw ApiException.badRequest("Invalid file size");
        }

        boolean isVideo = contentType != null && contentType.startsWith("video");
        long limit = isVideo ? maxVideoSize : maxImageSize;

        if (fileSize > limit) {
            throw ApiException.badRequest("File size exceeds limit of " + (limit / (1024 * 1024)) + "MB");
        }
    }
}