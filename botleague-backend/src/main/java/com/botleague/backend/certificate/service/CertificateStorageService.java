package com.botleague.backend.certificate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Server-side R2 reads/writes for the generation engine — distinct from
 * UploadService, which only ever mints presigned PUT URLs for a browser to
 * upload directly. Here the backend itself is the one reading a template
 * background and writing back the rendered PDF/image/QR, so a direct
 * S3Client call is simpler and avoids an unnecessary presign round-trip.
 */
@Service
public class CertificateStorageService {

    private static final String TEMPLATE_PREFIX = "certificates/templates/";
    private static final String ISSUED_PREFIX = "certificates/issued/";

    private final S3Client s3Client;

    @Value("${r2.bucket}")
    private String bucket;

    public CertificateStorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public byte[] download(String key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();
        try (ResponseInputStream<GetObjectResponse> in = s3Client.getObject(request)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            in.transferTo(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to download certificate asset: " + key, e);
        }
    }

    /**
     * Keyed by certificate number (not the row id) — the number is already
     * finalized before rendering starts, so this avoids the chicken-and-egg
     * problem of needing a DB-assigned id before the row it belongs to can
     * be saved with its NOT NULL pdf_key/image_key populated.
     */
    public String uploadIssuedAsset(String certificateNumber, String suffix, String contentType, byte[] bytes) {
        String key = ISSUED_PREFIX + certificateNumber + "/" + suffix;
        upload(key, contentType, bytes);
        return key;
    }

    public void upload(String key, String contentType, byte[] bytes) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength((long) bytes.length)
                .build();
        s3Client.putObject(request, RequestBody.fromBytes(bytes));
    }

    public String templatePrefix() {
        return TEMPLATE_PREFIX;
    }

    public String issuedPrefix() {
        return ISSUED_PREFIX;
    }
}
