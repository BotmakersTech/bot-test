package com.botleague.backend.common.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.profile.dto.UploadResponse;

import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class UploadService {

    private final S3Presigner presigner;

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

    public UploadService(S3Presigner presigner) {
        this.presigner = presigner;
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
    // PUBLIC URL BUILDER
    // =========================
    private String buildPublicUrl(String key) {
        return publicBaseUrl + "/" + key;
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