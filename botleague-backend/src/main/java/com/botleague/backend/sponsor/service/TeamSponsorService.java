package com.botleague.backend.sponsor.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.botleague.backend.sponsor.dto.TeamSponsorRequest;
import com.botleague.backend.sponsor.dto.TeamSponsorResponse;
import com.botleague.backend.sponsor.entity.TeamSponsor;
import com.botleague.backend.sponsor.repository.TeamSponsorRepository;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.enums.TeamRole;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;

@Service
@Transactional
public class TeamSponsorService {

    private final TeamSponsorRepository sponsorRepository;
    private final TeamRepository teamRepository;
    private final TeamMembershipRepository membershipRepository;

    public TeamSponsorService(
            TeamSponsorRepository sponsorRepository,
            TeamRepository teamRepository,
            TeamMembershipRepository membershipRepository) {
        this.sponsorRepository = sponsorRepository;
        this.teamRepository = teamRepository;
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public List<TeamSponsorResponse> getSponsorsForTeam(UUID teamId) {
        return sponsorRepository.findByTeamIdOrderByDisplayOrderAscCreatedAtAsc(teamId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TeamSponsorResponse addSponsor(UUID teamId, UUID callerId, TeamSponsorRequest request) {
        requireCaptain(teamId, callerId);

        TeamSponsor sponsor = new TeamSponsor();
        sponsor.setTeamId(teamId);
        sponsor.setCreatedBy(callerId);
        sponsor.setSponsorName(request.getSponsorName().trim());
        sponsor.setSponsorType(request.getSponsorType());
        sponsor.setWebsite(request.getWebsite());
        sponsor.setLogoUrl(request.getLogoUrl());
        sponsor.setDescription(request.getDescription());

        int order = request.getDisplayOrder() != null
                ? request.getDisplayOrder()
                : (int) (sponsorRepository.countByTeamId(teamId) + 1);
        sponsor.setDisplayOrder(order);

        return toResponse(sponsorRepository.save(sponsor));
    }

    public TeamSponsorResponse updateSponsor(UUID sponsorId, UUID callerId, TeamSponsorRequest request, boolean isAdmin) {
        TeamSponsor sponsor = findSponsorOrThrow(sponsorId);

        if (!isAdmin) {
            requireCaptain(sponsor.getTeamId(), callerId);
        }

        sponsor.setSponsorName(request.getSponsorName().trim());
        if (request.getSponsorType() != null)  sponsor.setSponsorType(request.getSponsorType());
        if (request.getWebsite()     != null)  sponsor.setWebsite(request.getWebsite());
        if (request.getLogoUrl()     != null)  sponsor.setLogoUrl(request.getLogoUrl());
        if (request.getDescription() != null)  sponsor.setDescription(request.getDescription());
        if (request.getDisplayOrder()!= null)  sponsor.setDisplayOrder(request.getDisplayOrder());

        return toResponse(sponsorRepository.save(sponsor));
    }

    public void deleteSponsor(UUID sponsorId, UUID callerId, boolean isAdmin) {
        TeamSponsor sponsor = findSponsorOrThrow(sponsorId);

        if (!isAdmin) {
            requireCaptain(sponsor.getTeamId(), callerId);
        }

        sponsorRepository.deleteById(sponsorId);
    }

    /** Used to gate the presigned-upload-URL endpoint before any sponsor record exists. */
    public void assertCanManage(UUID teamId, UUID callerId, boolean isAdmin) {
        if (!isAdmin) {
            requireCaptain(teamId, callerId);
        }
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private void requireCaptain(UUID teamId, UUID callerId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalStateException("Team not found: " + teamId));

        boolean isCreator = team.getCreatedBy().equals(callerId);
        boolean hasCaptainRole = membershipRepository
                .existsByTeamIdAndUserIdAndRoleInTeamAndStatus(
                        teamId, callerId, TeamRole.CAPTAIN, TeamMembershipStatus.ACTIVE);

        if (!isCreator && !hasCaptainRole) {
            throw new IllegalStateException("Only team captains can manage sponsors");
        }
    }

    private TeamSponsor findSponsorOrThrow(UUID sponsorId) {
        return sponsorRepository.findById(sponsorId)
                .orElseThrow(() -> new IllegalStateException("Sponsor not found: " + sponsorId));
    }

    private TeamSponsorResponse toResponse(TeamSponsor s) {
        TeamSponsorResponse r = new TeamSponsorResponse();
        r.setId(s.getId());
        r.setTeamId(s.getTeamId());
        r.setSponsorName(s.getSponsorName());
        r.setSponsorType(s.getSponsorType());
        r.setWebsite(s.getWebsite());
        r.setLogoUrl(s.getLogoUrl());
        r.setDescription(s.getDescription());
        r.setDisplayOrder(s.getDisplayOrder());
        r.setCreatedBy(s.getCreatedBy());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }
}
