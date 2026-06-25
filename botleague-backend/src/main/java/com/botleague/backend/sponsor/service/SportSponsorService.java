package com.botleague.backend.sponsor.service;

import com.botleague.backend.sponsor.dto.SportSponsorRequest;
import com.botleague.backend.sponsor.dto.SportSponsorResponse;
import com.botleague.backend.sponsor.entity.SportSponsor;
import com.botleague.backend.sponsor.repository.SportSponsorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SportSponsorService {

    private final SportSponsorRepository repo;

    public SportSponsorService(SportSponsorRepository repo) {
        this.repo = repo;
    }

    public List<SportSponsorResponse> getSponsorsForSport(UUID sportId) {
        return repo.findBySportIdOrderByDisplayOrderAscCreatedAtAsc(sportId)
                   .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SportSponsorResponse addSponsor(UUID sportId, UUID callerId, SportSponsorRequest req) {
        SportSponsor s = new SportSponsor();
        s.setSportId(sportId);
        s.setCreatedBy(callerId);
        apply(s, req);
        return toResponse(repo.save(s));
    }

    public SportSponsorResponse updateSponsor(UUID sponsorId, SportSponsorRequest req) {
        SportSponsor s = repo.findById(sponsorId)
            .orElseThrow(() -> new NoSuchElementException("Sport sponsor not found: " + sponsorId));
        apply(s, req);
        return toResponse(repo.save(s));
    }

    public void deleteSponsor(UUID sponsorId) {
        if (!repo.existsById(sponsorId))
            throw new NoSuchElementException("Sport sponsor not found: " + sponsorId);
        repo.deleteById(sponsorId);
    }

    private void apply(SportSponsor s, SportSponsorRequest req) {
        s.setSponsorName(req.getSponsorName());
        s.setSponsorType(req.getSponsorType());
        s.setWebsite(req.getWebsite());
        s.setLogoUrl(req.getLogoUrl());
        s.setDisplayOrder(req.getDisplayOrder());
    }

    private SportSponsorResponse toResponse(SportSponsor s) {
        SportSponsorResponse r = new SportSponsorResponse();
        r.setId(s.getId());
        r.setSportId(s.getSportId());
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
