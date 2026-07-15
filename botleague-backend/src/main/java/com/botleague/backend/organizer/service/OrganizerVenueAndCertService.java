package com.botleague.backend.organizer.service;

import com.botleague.backend.organizer.dto.OrganizerDTOs.*;
import com.botleague.backend.organizer.entity.EventCertificate;
import com.botleague.backend.organizer.entity.EventVenueDetail;
import com.botleague.backend.organizer.repository.EventCertificateRepository;
import com.botleague.backend.organizer.repository.EventVenueDetailRepository;
import com.botleague.backend.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manages venue details and certificate issuance for organiser events.
 */
@Service
@Transactional
public class OrganizerVenueAndCertService {

    private final EventVenueDetailRepository venueRepo;
    private final EventCertificateRepository certRepo;

    public OrganizerVenueAndCertService(
            EventVenueDetailRepository venueRepo,
            EventCertificateRepository certRepo) {
        this.venueRepo = venueRepo;
        this.certRepo  = certRepo;
    }

    // ── VENUE DETAIL ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public VenueDetailResponse getVenueDetail(UUID eventId) {
        return venueRepo.findByEventId(eventId)
                .map(this::toVenueResponse)
                .orElseGet(() -> {
                    VenueDetailResponse empty = new VenueDetailResponse();
                    empty.eventId = eventId;
                    return empty;
                });
    }

    public VenueDetailResponse upsertVenueDetail(UUID eventId, VenueDetailRequest req) {
        EventVenueDetail v = venueRepo.findByEventId(eventId).orElseGet(() -> {
            EventVenueDetail nv = new EventVenueDetail();
            nv.setEventId(eventId);
            return nv;
        });
        if (req.floorPlanUrl          != null) v.setFloorPlanUrl(req.floorPlanUrl);
        if (req.arenaCount            != null) v.setArenaCount(req.arenaCount);
        if (req.seatingCapacity       != null) v.setSeatingCapacity(req.seatingCapacity);
        if (req.hasPower              != null) v.setHasPower(req.hasPower);
        if (req.hasInternet           != null) v.setHasInternet(req.hasInternet);
        if (req.hasMedicalFacility    != null) v.setHasMedicalFacility(req.hasMedicalFacility);
        if (req.parkingCapacity       != null) v.setParkingCapacity(req.parkingCapacity);
        if (req.emergencyContactName  != null) v.setEmergencyContactName(req.emergencyContactName);
        if (req.emergencyContactPhone != null) v.setEmergencyContactPhone(req.emergencyContactPhone);
        if (req.safetyCompliant       != null) v.setSafetyCompliant(req.safetyCompliant);
        if (req.checklistJson         != null) v.setChecklistJson(req.checklistJson);
        if (req.additionalNotes       != null) v.setAdditionalNotes(req.additionalNotes);
        return toVenueResponse(venueRepo.save(v));
    }

    // ── CERTIFICATES ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CertificateResponse> getCertificates(UUID eventId) {
        return certRepo.findByEventId(eventId).stream()
                .map(this::toCertResponse).collect(Collectors.toList());
    }

    public CertificateResponse issueCertificate(UUID eventId, CertificateRequest req) {
        EventCertificate c = new EventCertificate();
        c.setEventId(eventId);
        c.setRecipientUserId(req.recipientUserId);
        c.setRecipientName(req.recipientName);
        c.setCertificateType(req.certificateType);
        c.setSportId(req.sportId);
        c.setPosition(req.position);
        c.setPdfUrl(req.pdfUrl);
        c.setTeamName(req.teamName);
        c.setSportName(req.sportName);
        c.setIssuedAt(LocalDateTime.now());
        return toCertResponse(certRepo.save(c));
    }

    public CertificateResponse updateCertificate(UUID certId, CertificateRequest req) {
        EventCertificate c = certRepo.findById(certId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found"));
        if (req.recipientName   != null) c.setRecipientName(req.recipientName);
        if (req.certificateType != null) c.setCertificateType(req.certificateType);
        if (req.sportId         != null) c.setSportId(req.sportId);
        if (req.position        != null) c.setPosition(req.position);
        if (req.pdfUrl          != null) c.setPdfUrl(req.pdfUrl);
        if (req.teamName        != null) c.setTeamName(req.teamName);
        if (req.sportName       != null) c.setSportName(req.sportName);
        return toCertResponse(certRepo.save(c));
    }

    public void deleteCertificate(UUID certId) {
        certRepo.deleteById(certId);
    }

    // ── MAPPERS ──────────────────────────────────────────────────────────────

    private VenueDetailResponse toVenueResponse(EventVenueDetail v) {
        VenueDetailResponse r = new VenueDetailResponse();
        r.id = v.getId(); r.eventId = v.getEventId(); r.floorPlanUrl = v.getFloorPlanUrl();
        r.arenaCount = v.getArenaCount(); r.seatingCapacity = v.getSeatingCapacity();
        r.hasPower = v.getHasPower(); r.hasInternet = v.getHasInternet();
        r.hasMedicalFacility = v.getHasMedicalFacility(); r.parkingCapacity = v.getParkingCapacity();
        r.emergencyContactName = v.getEmergencyContactName();
        r.emergencyContactPhone = v.getEmergencyContactPhone();
        r.safetyCompliant = v.getSafetyCompliant(); r.checklistJson = v.getChecklistJson();
        r.additionalNotes = v.getAdditionalNotes(); r.updatedAt = v.getUpdatedAt();
        return r;
    }

    private CertificateResponse toCertResponse(EventCertificate c) {
        CertificateResponse r = new CertificateResponse();
        r.id = c.getId(); r.eventId = c.getEventId();
        r.recipientUserId = c.getRecipientUserId(); r.recipientName = c.getRecipientName();
        r.certificateType = c.getCertificateType(); r.sportId = c.getSportId();
        r.sportName = c.getSportName(); r.teamName = c.getTeamName();
        r.position = c.getPosition(); r.pdfUrl = c.getPdfUrl();
        r.issuedAt = c.getIssuedAt(); r.createdAt = c.getCreatedAt();
        return r;
    }
}
