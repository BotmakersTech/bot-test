package com.botleague.backend.certificate.engine;

import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.events.entity.EventSports;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Builds a PlaceholderContext from real, already-resolved data — no
 * free-text placeholders exist. Team/institute/robot names are taken as
 * plain snapshot strings (resolved by CertificateAllocationService) rather
 * than live entities, consistent with IssuedCertificate storing the same
 * values as point-in-time snapshots.
 */
@Component
public class PlaceholderResolver {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    public PlaceholderContext resolve(
            CertificateType certificateType,
            Event event,
            EventSports eventSport,
            String teamName,
            String instituteName,
            String robotName,
            String recipientName,
            Integer positionRank,
            String certificateNumber,
            String verificationUrl,
            LocalDate issueDate
    ) {
        PlaceholderContext ctx = new PlaceholderContext();
        ctx.put(PlaceholderKey.PARTICIPANT_NAME, recipientName);
        ctx.put(PlaceholderKey.TEAM_NAME, teamName);
        ctx.put(PlaceholderKey.ROBOT_NAME, robotName);
        ctx.put(PlaceholderKey.EVENT_NAME, event.getEventName());
        ctx.put(PlaceholderKey.EVENT_SPORT, eventSport.getSport());
        ctx.put(PlaceholderKey.COMPETITION_CATEGORY, certificateType.getLabel());
        ctx.put(PlaceholderKey.POSITION, resolvePositionLabel(certificateType, positionRank));
        ctx.put(PlaceholderKey.RANK, positionRank != null ? String.valueOf(positionRank) : "");
        ctx.put(PlaceholderKey.INSTITUTE_NAME, instituteName);
        ctx.put(PlaceholderKey.ORGANIZER_NAME, event.getOrganizationName());
        ctx.put(PlaceholderKey.CERTIFICATE_ID, certificateNumber);
        ctx.put(PlaceholderKey.DATE, issueDate.format(DATE_FORMAT));
        ctx.put(PlaceholderKey.VERIFICATION_URL, verificationUrl);
        ctx.setQrPayloadUrl(verificationUrl);
        return ctx;
    }

    private String resolvePositionLabel(CertificateType certificateType, Integer rank) {
        switch (certificateType.getCategory()) {
            case CertificateType.CATEGORY_WINNER:
                return "Winner";
            case CertificateType.CATEGORY_RUNNER_UP:
                return "Runner-Up";
            case CertificateType.CATEGORY_SECOND_RUNNER_UP:
                return "Second Runner-Up";
            case CertificateType.CATEGORY_PARTICIPATION:
                return "Participant";
            case CertificateType.CATEGORY_SPECIAL:
                return certificateType.getLabel();
            default:
                return rank != null ? rank + " Place" : "";
        }
    }
}
