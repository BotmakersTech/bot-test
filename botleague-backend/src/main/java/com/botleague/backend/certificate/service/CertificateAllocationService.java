package com.botleague.backend.certificate.service;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.certificate.dto.ManualRecipientRequest;
import com.botleague.backend.certificate.entity.CertificateType;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.events.entity.SportRegistration;
import com.botleague.backend.events.enums.RegistrationStatus;
import com.botleague.backend.events.repository.SportRegistrationRepository;
import com.botleague.backend.ranking.entity.EventLeaderboardEntry;
import com.botleague.backend.ranking.repository.EventLeaderboardEntryRepository;
import com.botleague.backend.team.entity.Team;
import com.botleague.backend.team.entity.TeamMembership;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.team.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Resolves who gets a certificate, per the 3 eligibility rules — automatic
 * allocation, no manual recipient selection for ALL_REGISTERED/RANK_EQUALS.
 * Team-to-individual-member expansion always goes through TeamMembership:
 * every ACTIVE member of an eligible team gets their own certificate, since
 * this schema has no per-robot roster, only a team-level one.
 */
@Service
public class CertificateAllocationService {

    private final SportRegistrationRepository sportRegistrationRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final TeamRepository teamRepository;
    private final EventLeaderboardEntryRepository leaderboardEntryRepository;
    private final UserRepository userRepository;

    public CertificateAllocationService(
            SportRegistrationRepository sportRegistrationRepository,
            TeamMembershipRepository teamMembershipRepository,
            TeamRepository teamRepository,
            EventLeaderboardEntryRepository leaderboardEntryRepository,
            UserRepository userRepository) {
        this.sportRegistrationRepository = sportRegistrationRepository;
        this.teamMembershipRepository = teamMembershipRepository;
        this.teamRepository = teamRepository;
        this.leaderboardEntryRepository = leaderboardEntryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CertificateRecipient> resolve(CertificateType certificateType) {
        return switch (certificateType.getEligibilityRule()) {
            case CertificateType.RULE_ALL_REGISTERED -> resolveAllRegistered(certificateType.getEventSportId());
            case CertificateType.RULE_RANK_EQUALS -> resolveRankEquals(certificateType.getEventSportId(), certificateType.getEligibilityRank());
            case CertificateType.RULE_MANUAL_SELECT -> throw ApiException.badRequest(
                    "This certificate type uses MANUAL_SELECT — trigger generation with an explicit recipient list instead");
            default -> throw new IllegalStateException("Unknown eligibility rule: " + certificateType.getEligibilityRule());
        };
    }

    /** Every ACTIVE member of every team with a REGISTERED registration in this sport, deduped per team. */
    private List<CertificateRecipient> resolveAllRegistered(UUID eventSportId) {
        List<SportRegistration> registrations = sportRegistrationRepository
                .findByEventSportIdAndStatus(eventSportId, RegistrationStatus.REGISTERED);

        // A team may have multiple registered robots in this sport; dedupe to one
        // certificate per member regardless, since membership is team-scoped, not robot-scoped.
        LinkedHashMap<UUID, SportRegistration> firstRegistrationByTeam = new LinkedHashMap<>();
        for (SportRegistration registration : registrations) {
            if (registration.getTeamId() != null) {
                firstRegistrationByTeam.putIfAbsent(registration.getTeamId(), registration);
            }
        }

        List<CertificateRecipient> recipients = new ArrayList<>();
        for (UUID teamId : firstRegistrationByTeam.keySet()) {
            Team team = teamRepository.findById(teamId).orElse(null);
            String teamName = team != null ? team.getTeamName() : null;
            String instituteName = team != null ? team.getInstitutionName() : null;

            for (TeamMembership membership : teamMembershipRepository.findByTeamIdAndStatus(teamId, TeamMembershipStatus.ACTIVE)) {
                recipients.add(new CertificateRecipient(
                        membership.getUserId(),
                        resolveUserName(membership.getUserId()),
                        teamId,
                        teamName,
                        null,
                        null,
                        instituteName,
                        null
                ));
            }
        }
        return recipients;
    }

    /** Every ACTIVE member of every team whose finalized leaderboard entry sits at the configured rank. */
    private List<CertificateRecipient> resolveRankEquals(UUID eventSportId, Integer rank) {
        if (rank == null) {
            throw ApiException.badRequest("This certificate type has no eligibilityRank configured");
        }
        List<EventLeaderboardEntry> entries = leaderboardEntryRepository
                .findByEventSportIdAndIsFinalized(eventSportId, Boolean.TRUE)
                .stream()
                .filter(entry -> rank.equals(entry.getEventRank()))
                .collect(Collectors.toList());

        List<CertificateRecipient> recipients = new ArrayList<>();
        for (EventLeaderboardEntry entry : entries) {
            if (entry.getTeamId() == null) {
                continue;
            }
            Team team = teamRepository.findById(entry.getTeamId()).orElse(null);
            String instituteName = team != null ? team.getInstitutionName() : null;

            for (TeamMembership membership : teamMembershipRepository.findByTeamIdAndStatus(entry.getTeamId(), TeamMembershipStatus.ACTIVE)) {
                recipients.add(new CertificateRecipient(
                        membership.getUserId(),
                        resolveUserName(membership.getUserId()),
                        entry.getTeamId(),
                        entry.getTeamName(),
                        entry.getRobotId(),
                        entry.getRobotName(),
                        instituteName,
                        entry.getEventRank()
                ));
            }
        }
        return recipients;
    }

    @Transactional(readOnly = true)
    public List<CertificateRecipient> resolveManual(List<ManualRecipientRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw ApiException.badRequest("At least one recipient is required for a manual generation trigger");
        }
        List<CertificateRecipient> recipients = new ArrayList<>();
        for (ManualRecipientRequest request : requests) {
            String recipientName = request.getRecipientUserId() != null
                    ? resolveUserName(request.getRecipientUserId())
                    : request.getRecipientName();
            if (recipientName == null || recipientName.isBlank()) {
                throw ApiException.badRequest("Each manual recipient needs either a recipientUserId or an explicit recipientName");
            }
            Team team = request.getTeamId() != null ? teamRepository.findById(request.getTeamId()).orElse(null) : null;
            recipients.add(new CertificateRecipient(
                    request.getRecipientUserId(),
                    recipientName,
                    request.getTeamId(),
                    team != null ? team.getTeamName() : null,
                    request.getRobotId(),
                    request.getRobotName(),
                    team != null ? team.getInstitutionName() : null,
                    request.getPositionRank()
            ));
        }
        return recipients;
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId).map(this::displayName).orElse(null);
    }

    private String displayName(User user) {
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String full = (first + " " + last).trim();
        return !full.isBlank() ? full : user.getUsername();
    }
}
