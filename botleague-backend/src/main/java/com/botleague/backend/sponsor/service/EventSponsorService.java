package com.botleague.backend.sponsor.service;

import com.botleague.backend.common.security.AuthorizationService;
import com.botleague.backend.sponsor.dto.EventSponsorRequest;
import com.botleague.backend.sponsor.dto.EventSponsorResponse;
import com.botleague.backend.sponsor.entity.EventSponsor;
import com.botleague.backend.sponsor.repository.EventSponsorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventSponsorService {

    private final EventSponsorRepository repo;
    private final AuthorizationService authorizationService;

    public EventSponsorService(EventSponsorRepository repo, AuthorizationService authorizationService) {
        this.repo = repo;
        this.authorizationService = authorizationService;
    }

    /** Platform admins/organiser owner can manage any of their events' sponsors; EVENT_HEAD only their assigned events. */
    public void assertCanManage(UUID eventId, UUID callerId, List<String> callerRoles) {
        authorizationService.assertCanManageEvent(callerId, eventId);
    }

    public List<EventSponsorResponse> getSponsorsForEvent(UUID eventId) {
        return repo.findByEventIdOrderByDisplayOrderAscCreatedAtAsc(eventId)
                   .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public EventSponsorResponse addSponsor(UUID eventId, UUID callerId, EventSponsorRequest req) {
        EventSponsor s = new EventSponsor();
        s.setEventId(eventId);
        s.setCreatedBy(callerId);
        apply(s, req);
        return toResponse(repo.save(s));
    }

    public EventSponsorResponse updateSponsor(UUID sponsorId, EventSponsorRequest req) {
        EventSponsor s = repo.findById(sponsorId)
            .orElseThrow(() -> new NoSuchElementException("Event sponsor not found: " + sponsorId));
        apply(s, req);
        return toResponse(repo.save(s));
    }

    public void deleteSponsor(UUID sponsorId) {
        if (!repo.existsById(sponsorId))
            throw new NoSuchElementException("Event sponsor not found: " + sponsorId);
        repo.deleteById(sponsorId);
    }

    /** Resolves the eventId that owns a given sponsor row — needed for update/delete ownership checks. */
    public UUID getEventIdForSponsor(UUID sponsorId) {
        return repo.findById(sponsorId)
                .orElseThrow(() -> new NoSuchElementException("Event sponsor not found: " + sponsorId))
                .getEventId();
    }

    private void apply(EventSponsor s, EventSponsorRequest req) {
        s.setSponsorName(req.getSponsorName());
        s.setSponsorType(req.getSponsorType());
        s.setWebsite(req.getWebsite());
        s.setLogoUrl(req.getLogoUrl());
        s.setDisplayOrder(req.getDisplayOrder());
    }

    private EventSponsorResponse toResponse(EventSponsor s) {
        EventSponsorResponse r = new EventSponsorResponse();
        r.setId(s.getId());
        r.setEventId(s.getEventId());
        r.setSponsorName(s.getSponsorName());
        r.setSponsorType(s.getSponsorType());
        r.setWebsite(s.getWebsite());
        r.setLogoUrl(s.getLogoUrl());
        r.setDisplayOrder(s.getDisplayOrder());
        r.setCreatedBy(s.getCreatedBy());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }
}
