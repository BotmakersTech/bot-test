package com.botleague.backend.auth.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.botleague.backend.auth.dto.OtpRequestDTO;
import com.botleague.backend.auth.service.OtpService;
import com.botleague.backend.common.exception.ApiException;

@RestController
@RequestMapping("/api/auth")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    // ================= SEND OTP =================

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody OtpRequestDTO body) {
        String phone = body.getPhone();
        if (phone == null || phone.isBlank()) {
            throw ApiException.badRequest("Phone number is required");
        }
        if (!phone.matches("^[0-9]{10}$")) {
            throw ApiException.badRequest("Invalid phone number — must be exactly 10 digits");
        }

        boolean sent = otpService.sendOtp(phone);

        if (!sent) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to send OTP"));
        }

        return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
    }

    // ================= VERIFY OTP =================

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody OtpRequestDTO body) {
        String phone = body.getPhone();
        String otp   = body.getOtp();
        if (phone == null || phone.isBlank()) throw ApiException.badRequest("Phone number is required");
        if (otp   == null || otp.isBlank())   throw ApiException.badRequest("OTP is required");

        // throws ApiException.badRequest() if OTP is wrong/expired
        otpService.verifyOtp(phone, otp);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP verified successfully"));
    }

    // ================= RESEND OTP =================

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(@RequestBody OtpRequestDTO body) {
        String phone = body.getPhone();
        if (phone == null || phone.isBlank()) {
            throw ApiException.badRequest("Phone number is required");
        }
        if (!phone.matches("^[0-9]{10}$")) {
            throw ApiException.badRequest("Invalid phone number — must be exactly 10 digits");
        }

        boolean sent = otpService.resendOtp(phone);

        if (!sent) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Failed to resend OTP"));
        }

        return ResponseEntity.ok(Map.of("message", "OTP resent successfully"));
    }
}