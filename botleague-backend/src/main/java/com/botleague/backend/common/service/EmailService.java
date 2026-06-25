package com.botleague.backend.common.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    // 🔥 FRONTEND URL (VERY IMPORTANT)
    @Value("${app.frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ================= PASSWORD RESET =================

    public void sendPasswordResetEmail(String email, String token) {

        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String subject = "Reset Your BotLeague Password";

        String body = """
                Hello,

                We received a request to reset your password.

                Click the link below to reset your password:
                %s

                This link will expire in 15 minutes.

                If you did not request this, please ignore this email.

                — BotLeague Team
                """.formatted(resetLink);

        sendEmail(email, subject, body);
    }

    // ================= EMAIL VERIFICATION =================

    public void sendVerificationEmail(String email, String token) {

        String verifyLink = frontendUrl + "/verify-email?token=" + token;

        String subject = "Verify Your Email - BotLeague";

        String body = """
                Welcome to BotLeague!

                Please verify your email by clicking the link below:
                %s

                — BotLeague Team
                """.formatted(verifyLink);

        sendEmail(email, subject, body);
    }

    // ================= GENERIC EMAIL =================

    private void sendEmail(String to, String subject, String body) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}