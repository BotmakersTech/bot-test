package com.botleague.backend.common.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

    // Max allowed size (optional config)
    @Value("${upload.max-size-bytes:52428800}") // default 50MB
    private long maxSize;

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
        validateFileSize(fileSize);

      
        // =========================
        // 2. Build Put Request
        // =========================
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                //.contentType(contentType)
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
            throw new RuntimeException("Content type is required");
        }

        if (!(contentType.startsWith("image") || contentType.startsWith("video"))) {
            throw new RuntimeException("Only image and video uploads are allowed");
        }
    }

    private void validateFileSize(long fileSize) {

        if (fileSize <= 0) {
            throw new RuntimeException("Invalid file size");
        }

        if (fileSize > maxSize) {
            throw new RuntimeException("File size exceeds limit");
        }
    }
}