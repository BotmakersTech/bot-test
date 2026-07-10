package com.botleague.backend.auth.service;

import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.botleague.backend.common.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * OTP via MSG91 external API. MSG91 stores and verifies the codes, so we don't
 * need a local OTP table in Postgres.
 *
 * Key design points for a 2-core box:
 *   - RestTemplate has connect + read timeouts so a hung MSG91 call can't block
 *     a Tomcat thread forever.
 *   - verifyOtp THROWS on failure instead of returning false, because
 *     AuthService.resetPassword needs to abort the transaction on bad OTP.
 *   - sendOtp is called via afterCommit() in AuthService, so it never holds a
 *     pooled DB connection during the HTTP call.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private static final String COUNTRY_CODE = "91";

    private static final String SEND_URL   = "https://control.msg91.com/api/v5/otp";
    private static final String VERIFY_URL = "https://control.msg91.com/api/v5/otp/verify";
    private static final String RESEND_URL = "https://control.msg91.com/api/v5/otp/retry";

    private final String authKey;
    private final String templateId;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OtpService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${msg91.auth-key}") String authKey,
            @Value("${msg91.template-id}") String templateId) {
        this.authKey = authKey;
        this.templateId = templateId;
        // 5s connect, 10s read — if MSG91 is slower than this, fail fast
        // rather than holding a Tomcat thread hostage.
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    // ===================== SEND =====================

    /**
     * Sends OTP via MSG91. Returns true on success, false on failure.
     * Does NOT throw — callers (forgotPassword) intentionally stay silent
     * about whether the phone number exists.
     */
    public boolean sendOtp(String phone) {

        HttpHeaders headers = msg91Headers();

        Map<String, String> body = Map.of(
                "mobile", COUNTRY_CODE + phone,
                "template_id", templateId);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response =
                    restTemplate.postForEntity(SEND_URL, request, String.class);

            log.info("MSG91 send OTP status={} phone={}****",
                    response.getStatusCode(), phone.substring(0, 4));

            return response.getStatusCode() == HttpStatus.OK;

        } catch (Exception e) {
            // Log the error but don't expose it to the caller — forgotPassword
            // must stay silent about whether the phone exists.
            log.error("MSG91 send OTP failed for phone={}****: {}",
                    phone.substring(0, 4), e.getMessage());
            return false;
        }
    }

    // ===================== VERIFY =====================

    /**
     * Verifies OTP via MSG91. THROWS ApiException on failure so that
     * AuthService.resetPassword aborts cleanly with a 400.
     */
    public void verifyOtp(String phone, String otp) {

        HttpHeaders headers = msg91Headers();

        Map<String, String> body = Map.of(
                "mobile", COUNTRY_CODE + phone,
                "otp", otp);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response =
                    restTemplate.postForEntity(VERIFY_URL, request, String.class);

            JsonNode json = objectMapper.readTree(response.getBody());
            String type = json.has("type") ? json.get("type").asText() : "";

            log.info("MSG91 verify OTP type={} phone={}****",
                    type, phone.substring(0, 4));

            if (!"success".equalsIgnoreCase(type)) {
                // MSG91 returned a non-success response (wrong code, expired, etc.)
                String msg = json.has("message") ? json.get("message").asText() : "OTP verification failed";
                throw ApiException.badRequest(msg);
            }

        } catch (ApiException e) {
            // re-throw our own exceptions
            throw e;
        } catch (Exception e) {
            // network error, timeout, JSON parse failure
            log.error("MSG91 verify OTP failed for phone={}****: {}",
                    phone.substring(0, 4), e.getMessage());
            throw ApiException.badRequest("OTP verification failed, please try again");
        }
    }

    // ===================== RESEND =====================

    /**
     * Resends OTP via MSG91. Returns true on success, false on failure.
     */
    public boolean resendOtp(String phone) {

        HttpHeaders headers = new HttpHeaders();
        headers.set("authkey", authKey);

        String url = UriComponentsBuilder.fromHttpUrl(RESEND_URL)
                .queryParam("mobile", COUNTRY_CODE + phone)
                .queryParam("retrytype", "text")
                .toUriString();

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response =
                    restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            log.info("MSG91 resend OTP status={} phone={}****",
                    response.getStatusCode(), phone.substring(0, 4));

            return response.getStatusCode() == HttpStatus.OK;

        } catch (Exception e) {
            log.error("MSG91 resend OTP failed for phone={}****: {}",
                    phone.substring(0, 4), e.getMessage());
            return false;
        }
    }

    // ===================== HELPERS =====================

    private HttpHeaders msg91Headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("authkey", authKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}