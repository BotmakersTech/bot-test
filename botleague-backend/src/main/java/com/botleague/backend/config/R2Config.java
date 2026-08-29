package com.botleague.backend.config;

import java.net.URI;
import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.retry.RetryMode;
import software.amazon.awssdk.core.retry.RetryPolicy;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region; // ✅ Correct import
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Both clients previously ran on bare SDK defaults — no timeout, so a
 * request-handling thread could block indefinitely on an R2 stall/outage,
 * and no explicit connection-pool sizing. On a 2-core box with a small
 * Tomcat thread pool (see application.properties), that's a real path to
 * thread-pool exhaustion under load.
 */
@Configuration
public class R2Config {

    @Value("${r2.account-id}")
    private String accountId;

    @Value("${r2.access-key}")
    private String accessKey;

    @Value("${r2.secret-key}")
    private String secretKey;

    @Value("${r2.api-call-timeout-seconds:30}")
    private long apiCallTimeoutSeconds;

    @Value("${r2.api-call-attempt-timeout-seconds:10}")
    private long apiCallAttemptTimeoutSeconds;

    @Value("${r2.max-connections:25}")
    private int maxConnections;

    private URI getEndpoint() {
        return URI.create("https://" + accountId + ".r2.cloudflarestorage.com");
    }

    private ClientOverrideConfiguration overrideConfiguration() {
        return ClientOverrideConfiguration.builder()
                .apiCallTimeout(Duration.ofSeconds(apiCallTimeoutSeconds))
                .apiCallAttemptTimeout(Duration.ofSeconds(apiCallAttemptTimeoutSeconds))
                .retryPolicy(RetryPolicy.forRetryMode(RetryMode.STANDARD))
                .build();
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .endpointOverride(getEndpoint())
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKey, secretKey)
                        )
                )
                .region(Region.of("auto")) // ✅ Works for Cloudflare R2
                .overrideConfiguration(overrideConfiguration())
                .httpClientBuilder(ApacheHttpClient.builder()
                        .maxConnections(maxConnections)
                        .connectionTimeout(Duration.ofSeconds(apiCallAttemptTimeoutSeconds)))
                .build();
    }

    @Bean
    public S3Presigner presigner() {
        return S3Presigner.builder()
                .endpointOverride(getEndpoint())
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKey, secretKey)
                        )
                )
                .region(Region.of("auto"))
                .build();
        // Presigning is a local, offline signature computation — no network
        // call is made, so no timeout/pool config applies here.
    }
}
