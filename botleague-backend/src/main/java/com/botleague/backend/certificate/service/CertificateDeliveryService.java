package com.botleague.backend.certificate.service;

import com.botleague.backend.certificate.entity.IssuedCertificate;
import com.botleague.backend.certificate.repository.IssuedCertificateRepository;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Certificate-specific email delivery — deliberately separate from the
 * generic EmailService (which only sends plain-text SimpleMailMessage,
 * fire-and-forget, for auth flows where "email failed" isn't user-visible).
 * A certificate is the actual deliverable of this feature, so its delivery
 * needs everything EmailService doesn't have: an HTML template, a PDF
 * attachment, and a bounded retry with the outcome reported back to the
 * caller instead of only ever being logged.
 */
@Service
public class CertificateDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(CertificateDeliveryService.class);

    /** 1 initial attempt + 2 retries — enough to ride out a transient SMTP
     *  hiccup without materially extending a batch job's total run time. */
    private static final int MAX_ATTEMPTS = 3;
    private static final long[] RETRY_BACKOFF_MS = {800, 2000};

    private final JavaMailSender mailSender;
    private final IssuedCertificateRepository issuedCertificateRepository;
    private final NotificationService notificationService;

    public CertificateDeliveryService(
            JavaMailSender mailSender,
            IssuedCertificateRepository issuedCertificateRepository,
            NotificationService notificationService) {
        this.mailSender = mailSender;
        this.issuedCertificateRepository = issuedCertificateRepository;
        this.notificationService = notificationService;
    }

    /**
     * Attempts email delivery (skipped, not failed, if there's no email on
     * file) and an in-app notification, then persists both outcomes onto the
     * IssuedCertificate row. Shared by the bulk-generation worker (called once
     * per recipient right after issuance) and the manual resend endpoint
     * (called again later for a single certificate) — same logic either way,
     * the only difference is who supplies the PDF bytes and when.
     */
    public void deliverAndNotify(IssuedCertificate issued, String certificateLabel, String eventName,
                                  String eventSportName, byte[] pdfBytes) {
        String email = issued.getRecipientEmailSnapshot();
        if (email == null || email.isBlank()) {
            issued.setDeliveryStatus(IssuedCertificate.DELIVERY_SKIPPED);
            issued.setLastDeliveryError("No email address on file for this recipient");
        } else {
            DeliveryOutcome outcome = send(email, issued.getRecipientNameSnapshot(), certificateLabel,
                    eventName, eventSportName, issued.getVerificationUrl(), pdfBytes);
            issued.setDeliveryAttempts(issued.getDeliveryAttempts() + outcome.attempts);
            if (outcome.success) {
                issued.setDeliveryStatus(IssuedCertificate.DELIVERY_SENT);
                issued.setDeliveredAt(LocalDateTime.now());
                issued.setLastDeliveryError(null);
            } else {
                issued.setDeliveryStatus(IssuedCertificate.DELIVERY_FAILED);
                issued.setLastDeliveryError(outcome.error);
                log.warn("[CertificateDelivery] gave up on {} after {} attempts: {}",
                        issued.getCertificateNumber(), outcome.attempts, outcome.error);
            }
        }

        if (issued.getRecipientUserId() != null && !issued.isInAppNotified()) {
            try {
                notificationService.systemNotify(
                        "🏆 Your certificate is ready",
                        certificateLabel + " for " + eventName + " has been issued — tap to view and download it.",
                        NotificationType.CERTIFICATE_ISSUED,
                        NotificationPriority.ACHIEVEMENT,
                        NotificationTargetType.USER,
                        issued.getRecipientUserId(),
                        "/certificates");
                issued.setInAppNotified(true);
            } catch (Exception e) {
                // In-app notification is a nice-to-have alongside email, not the
                // primary delivery channel — never let it fail the whole outcome.
                log.warn("[CertificateDelivery] in-app notify failed for {}: {}", issued.getCertificateNumber(), e.getMessage());
            }
        }

        issuedCertificateRepository.save(issued);
    }

    public static final class DeliveryOutcome {
        public final boolean success;
        public final int attempts;
        public final String error;

        private DeliveryOutcome(boolean success, int attempts, String error) {
            this.success = success;
            this.attempts = attempts;
            this.error = error;
        }

        static DeliveryOutcome success(int attempts) { return new DeliveryOutcome(true, attempts, null); }
        static DeliveryOutcome failure(int attempts, String error) { return new DeliveryOutcome(false, attempts, error); }
    }

    /**
     * Sends the certificate email with up to MAX_ATTEMPTS tries, short backoff
     * between them. Runs on the caller's thread (already a background worker
     * thread for the bulk-generation path, or a request thread for a single
     * manual resend — both fine to block briefly on).
     */
    public DeliveryOutcome send(String recipientEmail, String recipientName, String certificateLabel,
                                 String eventName, String eventSportName, String verificationUrl,
                                 byte[] pdfBytes) {
        String lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                sendOnce(recipientEmail, recipientName, certificateLabel, eventName, eventSportName, verificationUrl, pdfBytes);
                return DeliveryOutcome.success(attempt);
            } catch (Exception e) {
                lastError = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                log.warn("[CertificateDelivery] attempt {}/{} failed for {}: {}", attempt, MAX_ATTEMPTS, recipientEmail, lastError);
                if (attempt < MAX_ATTEMPTS) {
                    sleep(RETRY_BACKOFF_MS[attempt - 1]);
                }
            }
        }
        return DeliveryOutcome.failure(MAX_ATTEMPTS, lastError);
    }

    private void sendOnce(String recipientEmail, String recipientName, String certificateLabel,
                           String eventName, String eventSportName, String verificationUrl,
                           byte[] pdfBytes) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(recipientEmail);
        helper.setSubject("Your " + certificateLabel + " certificate is ready — BotLeague");
        helper.setText(
                plainTextFallback(recipientName, certificateLabel, eventName, verificationUrl),
                htmlBody(recipientName, certificateLabel, eventName, eventSportName, verificationUrl));
        helper.addAttachment("certificate.pdf", new ByteArrayResource(pdfBytes));

        mailSender.send(message);
    }

    private String plainTextFallback(String recipientName, String certificateLabel, String eventName, String verificationUrl) {
        return """
                Hi %s,

                Your "%s" certificate for %s is ready. It's attached as a PDF to this email.

                View and verify it online: %s

                — BotLeague Team
                """.formatted(escapeText(recipientName), escapeText(certificateLabel), escapeText(eventName), verificationUrl);
    }

    private String htmlBody(String recipientName, String certificateLabel, String eventName,
                             String eventSportName, String verificationUrl) {
        String subtitle = eventSportName != null ? escapeHtml(eventName) + " &middot; " + escapeHtml(eventSportName) : escapeHtml(eventName);
        return """
                <!doctype html>
                <html>
                <body style="margin:0;padding:0;background:#f5f6f8;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 0;">
                    <tr><td align="center">
                      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(1,98,209,0.08);">
                        <tr>
                          <td style="background:linear-gradient(135deg,#0162D1,#8C6CFF);padding:28px 32px;">
                            <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.5px;">BOT LEAGUE</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 32px 8px;">
                            <p style="margin:0 0 4px;color:#8a90a0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Certificate Issued</p>
                            <h1 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:700;">%s</h1>
                            <p style="margin:0 0 4px;color:#374151;font-size:15px;">Hi %s,</p>
                            <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                              Congratulations! Your <strong>%s</strong> certificate for <strong>%s</strong> has been issued and is attached to this email as a PDF.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 32px 32px;">
                            <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#0162D1,#8C6CFF);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 28px;border-radius:10px;">
                              View &amp; Verify Certificate
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 32px 32px;border-top:1px solid #eef0f4;">
                            <p style="margin:20px 0 0;color:#8a90a0;font-size:12px;line-height:1.6;">
                              This certificate can be independently verified at any time using the link above — anyone can scan its QR code or visit that link to confirm it's genuine.
                            </p>
                          </td>
                        </tr>
                      </table>
                      <p style="color:#8a90a0;font-size:11px;margin-top:20px;">BotLeague &middot; This is an automated message, please don't reply directly to this email.</p>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(escapeHtml(certificateLabel), escapeHtml(recipientName), escapeHtml(certificateLabel), subtitle, verificationUrl);
    }

    /** Recipient/team/event names are free-text user input rendered straight into
     *  HTML — without this, a name like {@code <script>} or {@code "><img onerror=} would
     *  be a stored-XSS vector against every mail client that renders the HTML part. */
    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private String escapeText(String s) {
        return s != null ? s : "";
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
