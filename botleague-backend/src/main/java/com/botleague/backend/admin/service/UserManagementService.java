package com.botleague.backend.admin.service;

import com.botleague.backend.admin.dto.PagedResponse;
import com.botleague.backend.admin.dto.UpdateUserProfileRequest;
import com.botleague.backend.admin.dto.UserSummaryResponse;
import com.botleague.backend.admin.entity.ResourceRoleAssignment;
import com.botleague.backend.admin.repository.ResourceRoleAssignmentRepository;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.enums.AccountStatus;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.admin.dto.CreateAdminUserRequest;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.BotleagueIdService;
import com.botleague.backend.common.security.PasswordHasher;
import com.botleague.backend.events.entity.Event;
import com.botleague.backend.team.enums.TeamMembershipStatus;
import com.botleague.backend.team.repository.TeamMembershipRepository;
import com.botleague.backend.events.entity.EventSports;
import com.botleague.backend.events.repository.EventRepository;
import com.botleague.backend.events.repository.EventSportsRepository;
import com.botleague.backend.role.entity.UserRole;
import com.botleague.backend.role.repository.UserRoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserManagementService {

    private static final List<AccountType> ROLE_PRIORITY = List.of(
            AccountType.SUPER_ADMIN, AccountType.ADMIN, AccountType.ORGANISER,
            AccountType.EVENT_HEAD, AccountType.SPORT_HEAD,
            AccountType.JUDGE, AccountType.VOLUNTEER, AccountType.COMPETITOR
    );

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final ResourceRoleAssignmentRepository resourceRoleAssignmentRepository;
    private final EventRepository eventRepository;
    private final EventSportsRepository eventSportsRepository;
    private final BotleagueIdService botleagueIdService;
    private final PasswordHasher passwordHasher;
    private final TeamMembershipRepository teamMembershipRepository;

    public UserManagementService(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            ResourceRoleAssignmentRepository resourceRoleAssignmentRepository,
            EventRepository eventRepository,
            EventSportsRepository eventSportsRepository,
            BotleagueIdService botleagueIdService,
            PasswordHasher passwordHasher,
            TeamMembershipRepository teamMembershipRepository) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.resourceRoleAssignmentRepository = resourceRoleAssignmentRepository;
        this.eventRepository = eventRepository;
        this.eventSportsRepository = eventSportsRepository;
        this.botleagueIdService = botleagueIdService;
        this.passwordHasher = passwordHasher;
        this.teamMembershipRepository = teamMembershipRepository;
    }

    // ── List / Search users (paginated) ───────────────────────────────────

    @Transactional(readOnly = true)
    public PagedResponse<UserSummaryResponse> searchUsers(String query, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> userPage = (query == null || query.isBlank())
                ? userRepository.findAll(pageRequest)
                : userRepository.searchUsers(query.trim(), pageRequest);

        List<UserSummaryResponse> content = userPage.getContent().stream()
                .map(u -> toSummary(u, false))
                .collect(Collectors.toList());

        return new PagedResponse<>(content, page, size,
                userPage.getTotalElements(), userPage.getTotalPages());
    }

    // ── Single user detail with assignments ──────────────────────────────

    @Transactional(readOnly = true)
    public UserSummaryResponse getUserDetail(UUID targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        return toSummary(user, true);
    }

    // ── Assign role ───────────────────────────────────────────────────────

    public void assignRole(UUID targetUserId, AccountType role, UUID assignedBy) {
        userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (userRoleRepository.existsByUserIdAndRoleType(targetUserId, role)) {
            return;
        }

        // Privilege-escalation guard: the controller's @PreAuthorize allows both
        // SUPER_ADMIN and ADMIN to call this endpoint, but only a SUPER_ADMIN
        // may grant SUPER_ADMIN or ADMIN — otherwise an ADMIN could grant
        // themselves (or anyone) SUPER_ADMIN. This same guard is what enforces
        // "ORGANISER accounts are provisioned only by ADMIN/SUPER_ADMIN" —
        // ORGANISER itself isn't escalation-guarded since no other role can
        // reach this endpoint at all.
        if (role == AccountType.SUPER_ADMIN || role == AccountType.ADMIN) {
            boolean callerIsSuperAdmin = userRoleRepository.findByUserId(assignedBy).stream()
                    .anyMatch(r -> r.getRoleType() == AccountType.SUPER_ADMIN);
            if (!callerIsSuperAdmin) {
                throw ApiException.forbidden("Only a Super Admin can assign the " + role + " role");
            }
        }

        UserRole userRole = new UserRole();
        userRole.setUserId(targetUserId);
        userRole.setRoleType(role);
        userRole.setStatus("APPROVED");
        userRole.setApprovedBy(assignedBy);
        userRoleRepository.save(userRole);
    }

    // ── Remove role ───────────────────────────────────────────────────────

    public void removeRole(UUID targetUserId, AccountType role, UUID removedBy) {
        if (role == AccountType.SUPER_ADMIN || role == AccountType.ADMIN) {
            boolean callerIsSuperAdmin = userRoleRepository.findByUserId(removedBy).stream()
                    .anyMatch(r -> r.getRoleType() == AccountType.SUPER_ADMIN);
            if (!callerIsSuperAdmin) {
                throw ApiException.forbidden("Only a Super Admin can remove the " + role + " role");
            }
        }
        userRoleRepository.findByUserIdAndRoleType(targetUserId, role)
                .ifPresent(userRoleRepository::delete);
    }

    // ── Update user profile ───────────────────────────────────────────────

    public UserSummaryResponse updateUserProfile(UUID targetUserId, UpdateUserProfileRequest request) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (request.getUsername()    != null) user.setUsername(request.getUsername());
        if (request.getFirstName()   != null) user.setFirstName(request.getFirstName());
        if (request.getLastName()    != null) user.setLastName(request.getLastName());
        if (request.getEmail()       != null) user.setEmail(request.getEmail());
        if (request.getPhone()       != null) user.setPhone(request.getPhone());
        if (request.getGender()      != null) user.setGender(request.getGender());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getCity()        != null) user.setCity(request.getCity());
        if (request.getState()       != null) user.setState(request.getState());
        if (request.getCountry()     != null) user.setCountry(request.getCountry());
        if (request.getAddress()     != null) user.setAddress(request.getAddress());
        userRepository.save(user);
        return toSummary(user, true);
    }

    // ── Suspend / Activate account ────────────────────────────────────────

    public void updateAccountStatus(UUID targetUserId, AccountStatus newStatus) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        user.setAccountStatus(newStatus);
        userRepository.save(user);
    }

    // ── Mapping helpers ───────────────────────────────────────────────────
    // Event/sport assignment writes now live entirely in OrganizerAssignmentService
    // (one write path instead of two out-of-sync ones — see /api/admin/assignments/*).

    private UserSummaryResponse toSummary(User user, boolean includeAssignments) {
        List<UserRole> roles = userRoleRepository.findByUserId(user.getId());
        List<String> roleNames = roles.stream()
                .map(r -> r.getRoleType().name())
                .collect(Collectors.toList());
        String primaryRole = roles.stream()
                .map(UserRole::getRoleType)
                .min(Comparator.comparingInt(r ->
                        ROLE_PRIORITY.indexOf(r) == -1 ? Integer.MAX_VALUE : ROLE_PRIORITY.indexOf(r)))
                .map(AccountType::name)
                .orElse(user.getAccountType() != null
                        ? user.getAccountType().name() : AccountType.COMPETITOR.name());

        UserSummaryResponse r = new UserSummaryResponse();
        r.setId(user.getId());
        r.setBotleagueId(user.getBotleagueId());
        r.setUsername(user.getUsername());
        r.setFirstName(user.getFirstName());
        r.setLastName(user.getLastName());
        r.setEmail(user.getEmail());
        r.setPhone(user.getPhone());
        r.setAccountStatus(user.getAccountStatus() != null ? user.getAccountStatus().name() : null);
        r.setPrimaryRole(primaryRole);
        r.setAllRoles(roleNames);
        r.setCreatedAt(user.getCreatedAt());
        r.setLastLoginAt(user.getLastLoginAt());
        r.setGender(user.getGender());
        r.setDateOfBirth(user.getDateOfBirth());
        r.setCity(user.getCity());
        r.setState(user.getState());
        r.setCountry(user.getCountry());
        r.setAddress(user.getAddress());
        r.setProfilePhotoUrl(user.getProfilePhotoUrl());

        if (includeAssignments) {
            r.setAssignedEvents(buildEventAssignmentsBatch(user.getId()));
            r.setAssignedSports(buildSportAssignmentsBatch(user.getId()));
        }
        return r;
    }

    /** Batch-fetches all events in one query instead of one query per assignment. */
    private List<UserSummaryResponse.AssignedEventDTO> buildEventAssignmentsBatch(UUID userId) {
        List<ResourceRoleAssignment> assignments = resourceRoleAssignmentRepository.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_EVENT.equals(a.getScopeType()))
                .collect(Collectors.toList());
        if (assignments.isEmpty()) return Collections.emptyList();

        Set<UUID> eventIds = assignments.stream()
                .map(ResourceRoleAssignment::getEventId).collect(Collectors.toSet());
        Map<UUID, Event> eventMap = eventRepository.findAllById(eventIds).stream()
                .collect(Collectors.toMap(Event::getId, Function.identity()));

        return assignments.stream().map(a -> {
            UserSummaryResponse.AssignedEventDTO dto = new UserSummaryResponse.AssignedEventDTO();
            dto.setEventId(a.getEventId());
            dto.setAssignedAt(a.getAssignedAt());
            Event ev = eventMap.get(a.getEventId());
            if (ev != null) {
                dto.setEventCode(ev.getEventCode());
                dto.setEventName(ev.getEventName());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    /** Batch-fetches all event sports + events in two queries instead of 2N queries. */
    private List<UserSummaryResponse.AssignedSportDTO> buildSportAssignmentsBatch(UUID userId) {
        List<ResourceRoleAssignment> assignments = resourceRoleAssignmentRepository.findByUserId(userId).stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_SPORT.equals(a.getScopeType()))
                .collect(Collectors.toList());
        if (assignments.isEmpty()) return Collections.emptyList();

        Set<UUID> sportIds = assignments.stream()
                .map(ResourceRoleAssignment::getScopeId).collect(Collectors.toSet());
        Set<UUID> eventIds = assignments.stream()
                .map(ResourceRoleAssignment::getEventId).collect(Collectors.toSet());

        Map<UUID, EventSports> sportMap = eventSportsRepository.findAllById(sportIds).stream()
                .collect(Collectors.toMap(EventSports::getId, Function.identity()));
        Map<UUID, Event> eventMap = eventRepository.findAllById(eventIds).stream()
                .collect(Collectors.toMap(Event::getId, Function.identity()));

        return assignments.stream().map(a -> {
            UserSummaryResponse.AssignedSportDTO dto = new UserSummaryResponse.AssignedSportDTO();
            dto.setEventSportId(a.getScopeId());
            dto.setEventId(a.getEventId());
            dto.setAssignedAt(a.getAssignedAt());
            EventSports es = sportMap.get(a.getScopeId());
            if (es != null) dto.setSport(es.getSport());
            Event ev = eventMap.get(a.getEventId());
            if (ev != null) dto.setEventName(ev.getEventName());
            return dto;
        }).collect(Collectors.toList());
    }

    // ── Create user (admin) ───────────────────────────────────────────────

    public UserSummaryResponse createAdminUser(CreateAdminUserRequest req) {
        if (userRepository.existsByPhone(req.getPhone())) {
            throw ApiException.conflict("Phone number already registered");
        }

        AccountType roleType;
        try { roleType = AccountType.valueOf(req.getRole().toUpperCase()); }
        catch (IllegalArgumentException e) { throw ApiException.badRequest("Unknown role: " + req.getRole()); }

        User user = new User();
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setPhone(req.getPhone());
        user.setEmail(req.getEmail());
        user.setBotleagueId(botleagueIdService.generateBotleagueUserId());
        user.setPasswordHash(passwordHasher.hash(req.getPassword()));
        user.setAccountType(roleType);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setPhoneVerified(true);
        user.setEmailVerified(req.getEmail() != null && !req.getEmail().isBlank());
        User saved = userRepository.save(user);

        UserRole role = new UserRole();
        role.setUserId(saved.getId());
        role.setRoleType(roleType);
        role.setStatus("APPROVED");
        userRoleRepository.save(role);

        return toSummary(saved, false);
    }

    // ── Users not in any active team (for captain picker) ─────────────────

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getUsersWithoutTeam() {
        Set<UUID> inTeam = teamMembershipRepository
                .findAll().stream()
                .filter(m -> m.getStatus() == TeamMembershipStatus.ACTIVE)
                .map(m -> m.getUserId())
                .collect(java.util.stream.Collectors.toSet());

        return userRepository.findAll().stream()
                .filter(u -> u.getDeletedAt() == null && u.getAccountStatus() == AccountStatus.ACTIVE)
                .filter(u -> !inTeam.contains(u.getId()))
                .map(u -> toSummary(u, false))
                .collect(Collectors.toList());
    }
}
