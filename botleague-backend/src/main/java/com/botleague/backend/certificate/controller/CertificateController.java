package com.botleague.backend.certificate.controller;

import com.botleague.backend.certificate.dto.IssuedCertificateResponse;
import com.botleague.backend.certificate.dto.PublicVerificationResponse;
import com.botleague.backend.certificate.service.CertificateVerificationService;
import com.botleague.backend.common.security.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Public QR verification + the logged-in participant's own certificate repository. */
@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateVerificationService verificationService;

    public CertificateController(CertificateVerificationService verificationService) {
        this.verificationService = verificationService;
    }

    /** No auth — this is what a QR scan / shared verification link hits. */
    @GetMapping("/verify/{certificateNumber}")
    public ResponseEntity<PublicVerificationResponse> verify(
            @PathVariable String certificateNumber, HttpServletRequest request) {
        String clientIp = ClientIpResolver.resolve(request);
        return ResponseEntity.ok(verificationService.verify(certificateNumber, clientIp));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IssuedCertificateResponse>> myCertificates(Authentication auth) {
        return ResponseEntity.ok(verificationService.myCertificates(extractUserId(auth)));
    }

    @GetMapping("/me/{issuedCertificateId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IssuedCertificateResponse> getMyCertificate(
            @PathVariable UUID issuedCertificateId, Authentication auth) {
        return ResponseEntity.ok(verificationService.getMyCertificate(issuedCertificateId, extractUserId(auth)));
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
