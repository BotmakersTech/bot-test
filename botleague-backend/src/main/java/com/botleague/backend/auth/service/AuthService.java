package com.botleague.backend.auth.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.botleague.backend.audit.service.AuditLogService;
import com.botleague.backend.auth.dto.*;
import com.botleague.backend.auth.entity.PasswordResetToken;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.admin.entity.ResourceRoleAssignment;
import com.botleague.backend.admin.repository.ResourceRoleAssignmentRepository;
import com.botleague.backend.auth.enums.AccountStatus;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.auth.enums.LoginType;
import com.botleague.backend.auth.enums.PhoneVerification;
import com.botleague.backend.auth.repository.PasswordResetTokenRepository;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.notification.enums.NotificationPriority;
import com.botleague.backend.notification.enums.NotificationTargetType;
import com.botleague.backend.notification.enums.NotificationType;
import com.botleague.backend.notification.service.NotificationService;
import com.botleague.backend.role.entity.UserRole;
import com.botleague.backend.role.repository.UserRoleRepository;
import com.botleague.backend.role.service.UserRoleService;
import com.botleague.backend.common.security.JwtService;
import com.botleague.backend.common.security.PasswordHasher;
import com.botleague.backend.common.security.TokenInvalidationRegistry;
import com.botleague.backend.common.service.BotleagueIdService;
import com.botleague.backend.common.service.EmailService;

@Service
public class AuthService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{10}$");

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final BotleagueIdService botleagueIdService;
    private final PasswordHasher passwordHasher;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final UserRoleRepository userRoleRepository;
    private final ResourceRoleAssignmentRepository resourceRoleAssignmentRepository;
    private final UserRoleService userRoleService;
    private final NotificationService notificationService;
    private final TokenInvalidationRegistry tokenInvalidationRegistry;
    private final AuditLogService auditLogService;

    private static final List<AccountType> ROLE_PRIORITY = List.of(
            AccountType.SUPER_ADMIN, AccountType.ADMIN, AccountType.ORGANISER,
            AccountType.EVENT_HEAD, AccountType.SPORT_HEAD,
            AccountType.JUDGE, AccountType.VOLUNTEER, AccountType.COMPETITOR
    );

    /** The only roles a user can grant themselves at registration — everything else
     *  (ADMIN, SUPER_ADMIN, EVENT_HEAD, SPORT_HEAD) is admin-appointed only. */
    private static final Set<AccountType> SELF_REGISTERABLE_ROLES = Set.of(
            AccountType.COMPETITOR, AccountType.VOLUNTEER, AccountType.ORGANISER, AccountType.JUDGE
    );

    /** Higher-trust roles that need admin approval before the account is usable. */
    private static final Set<AccountType> REQUIRES_APPROVAL_ROLES = Set.of(
            AccountType.ORGANISER, AccountType.JUDGE
    );

    public AuthService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            BotleagueIdService botleagueIdService,
            PasswordHasher passwordHasher,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            OtpService otpService,
            EmailService emailService,
            UserRoleRepository userRoleRepository,
            ResourceRoleAssignmentRepository resourceRoleAssignmentRepository,
            UserRoleService userRoleService,
            NotificationService notificationService,
            TokenInvalidationRegistry tokenInvalidationRegistry,
            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.botleagueIdService = botleagueIdService;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.otpService = otpService;
        this.emailService = emailService;
        this.userRoleRepository = userRoleRepository;
        this.resourceRoleAssignmentRepository = resourceRoleAssignmentRepository;
        this.userRoleService = userRoleService;
        this.notificationService = notificationService;
        this.tokenInvalidationRegistry = tokenInvalidationRegistry;
        this.auditLogService = auditLogService;
    }

    // ================= REGISTER =================

    @Transactional
    public AuthTokensDTO register(RegisterRequestDTO request) {

        // Prove phone ownership BEFORE revealing anything about whether that
        // number is already registered — otherwise an unauthenticated caller
        // could probe arbitrary phone numbers against this endpoint and use
        // the 409-vs-not response as a registered-phone-number oracle. This
        // also mirrors the OTP flow already required for resetPassword's
        // phone branch.
        otpService.verifyOtp(request.getPhone(), request.getOtp());

        if (userRepository.existsByPhone(request.getPhone())) {
            // 409, not a generic 500.
            throw ApiException.conflict("User already exists");
        }

        AccountType role;
        try {
            role = AccountType.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid role");
        }
        // Defense in depth beyond the DTO's own @Pattern whitelist — this is the
        // actual security boundary preventing self-registration of ADMIN/SUPER_ADMIN/
        // EVENT_HEAD/SPORT_HEAD, so it stays even though the DTO already restricts it.
        if (!SELF_REGISTERABLE_ROLES.contains(role)) {
            throw ApiException.badRequest("Invalid role");
        }

        boolean requiresApproval = REQUIRES_APPROVAL_ROLES.contains(role);

        String botleagueId = botleagueIdService.generateBotleagueUserId();
        // hashing is bounded so a registration burst can't pin both cores
        String hashedPassword = passwordHasher.hash(request.getPassword());

        User user = new User();
        user.setPhone(request.getPhone());
        user.setBotleagueId(botleagueId);
        user.setPasswordHash(hashedPassword);
        user.setAccountStatus(requiresApproval ? AccountStatus.PENDING : AccountStatus.ACTIVE);
        user.setAccountType(role);
        user.setPhoneVerified(true);

        userRepository.save(user);

        if (requiresApproval) {
            // Write the real UserRole row now, not at approval time — AuthorizationService
            // .canScoreMatch() checks userRoleRepository directly with NO fallback to
            // accountType (unlike getUserRoles()/getCurrentUser()), so a JUDGE who only
            // had accountType set would pass login but get a permanent 403 the moment
            // they tried to actually score a match. APPROVED here refers to the role
            // grant itself, not the account — AccountStatus.PENDING is what actually
            // blocks the account from being usable until an admin approves it.
            userRoleService.assignRole(user.getId(), role);

            UUID newUserId = user.getId();
            String newUserBotleagueId = botleagueId;
            AccountType newUserRole = role;
            // systemNotify()/dispatch() run REQUIRES_NEW and commit independently,
            // including an immediate realtime push — firing it before THIS transaction
            // commits risks notifying admins about a pending account that then fails to
            // actually persist. afterCommit() is the same pattern already used below by
            // createPasswordResetToken() for its email send.
            afterCommit(() -> notificationService.systemNotify(
                    "New " + newUserRole + " registration pending approval",
                    "A new " + newUserRole + " account (" + newUserBotleagueId
                            + ") has registered and needs approval before they can log in.",
                    NotificationType.ACCOUNT_PENDING_APPROVAL,
                    NotificationPriority.HIGH,
                    NotificationTargetType.PLATFORM_ADMINS,
                    null,
                    "/admin/users/" + newUserId));

            // No issueTokens() call — this is what actually enforces the approval gate.
            // login() is the only place accountStatus is checked; refresh() never checks
            // it at all, so a PENDING account that received tokens here could refresh its
            // session forever and never be blocked. Not issuing tokens means there is no
            // refresh token in existence to rotate in the first place.
            return new AuthTokensDTO(null, null, botleagueId, true);
        }

        return issueTokens(user, botleagueId);
    }

    // ================= LOGIN =================

    @Transactional
    public AuthTokensDTO login(LoginRequestDTO request) {

        if (request.getLoginType() == null) {
            throw ApiException.badRequest("Login type required");
        }

        var userOpt = (request.getLoginType() == LoginType.PHONE)
                ? userRepository.findByPhone(request.getIdentifier())
                : userRepository.findByEmailIgnoreCase(request.getIdentifier());

        if (userOpt.isEmpty()) {
            // Still pay the BCrypt cost so a non-existent identifier doesn't
            // respond measurably faster than a wrong password for a real one
            // — see PasswordHasher.matchesDummy().
            passwordHasher.matchesDummy(request.getPassword());
            throw ApiException.unauthorized("Invalid credentials");
        }
        User user = userOpt.get();

        if (!passwordHasher.matches(request.getPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid credentials");
        }

        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw ApiException.forbidden("Account inactive");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return issueTokens(user, user.getBotleagueId());
    }

    // ================= SELECT ROLE (post-Google-signin onboarding) =================
    // A fresh Google-signup account has no accountType yet (see GoogleAuthService).
    // This is the one-time follow-up that assigns it, reusing the exact same
    // self-registerable-role whitelist and admin-approval mechanics as register().

    @Transactional
    public AuthTokensDTO selectRole(String userId, SelectRoleRequestDTO request) {

        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (user.getAccountType() != null) {
            throw ApiException.badRequest("Role already selected");
        }

        AccountType role;
        try {
            role = AccountType.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid role");
        }
        if (!SELF_REGISTERABLE_ROLES.contains(role)) {
            throw ApiException.badRequest("Invalid role");
        }

        boolean requiresApproval = REQUIRES_APPROVAL_ROLES.contains(role);
        user.setAccountType(role);
        userRepository.save(user);

        if (requiresApproval) {
            user.setAccountStatus(AccountStatus.PENDING);
            userRepository.save(user);

            // Same reasoning as register()'s approval branch: the real UserRole
            // row is written now, and AccountStatus.PENDING is what actually
            // blocks the account.
            userRoleService.assignRole(user.getId(), role);

            UUID newUserId = user.getId();
            String newUserBotleagueId = user.getBotleagueId();
            AccountType newUserRole = role;
            afterCommit(() -> notificationService.systemNotify(
                    "New " + newUserRole + " registration pending approval",
                    "A new " + newUserRole + " account (" + newUserBotleagueId
                            + ") has registered and needs approval before they can log in.",
                    NotificationType.ACCOUNT_PENDING_APPROVAL,
                    NotificationPriority.HIGH,
                    NotificationTargetType.PLATFORM_ADMINS,
                    null,
                    "/admin/users/" + newUserId));

            // Unlike register() (which never issues tokens for a PENDING account
            // in the first place), this user is already authenticated from the
            // Google sign-in that preceded role selection — that session must be
            // torn down now so the same "PENDING == no live session" invariant
            // holds regardless of how PENDING was reached. Refresh tokens are
            // DB-backed and revokeAll() kills them immediately; the access token
            // already issued at Google sign-in is stateless, so it needs the
            // in-memory registry to stop being honored before its own TTL expires.
            refreshTokenService.revokeAll(user.getId());
            tokenInvalidationRegistry.invalidateNow(user.getId());

            return new AuthTokensDTO(null, null, user.getBotleagueId(), true);
        }

        // Re-issue tokens so the JWT's roles claim reflects the newly-selected
        // role immediately — the token issued at Google sign-in had an empty
        // roles claim, since accountType was null at that time.
        return issueTokens(user, user.getBotleagueId());
    }

    // ================= REFRESH =================

    @Transactional
    public AuthTokensDTO refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw ApiException.badRequest("Refresh token required");
        }
        RefreshTokenService.Rotation rotation = refreshTokenService.rotate(rawRefreshToken);

        User user = userRepository.findById(rotation.userId())
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        String access = jwtService.generateAccessToken(user.getId().toString(), getUserRoles(user));
        return new AuthTokensDTO(access, rotation.rawToken(), user.getBotleagueId());
    }

    // ================= LOGOUT =================

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    // ================= FORGOT PASSWORD =================

    @Transactional
    public void forgotPassword(ForgotPasswordRequestDTO request) {

        String identifier = request.getIdentifier();

        if (PHONE_PATTERN.matcher(identifier).matches()) {
            userRepository.findByPhone(identifier)
                    .ifPresent(user -> afterCommit(() -> otpService.sendOtp(user.getPhone())));
        } else {
            userRepository.findByEmailIgnoreCase(identifier)
                    .ifPresent(this::createPasswordResetToken);
        }
        // Always silent: never reveal whether the identifier exists.
    }

    // ================= RESET PASSWORD =================

    @Transactional
    public void resetPassword(ResetPasswordRequestDTO request) {

        // ----- OTP FLOW -----
        if (request.getOtp() != null && request.getPhone() != null) {
            otpService.verifyOtp(request.getPhone(), request.getOtp());

            User user = userRepository.findByPhone(request.getPhone())
                    .orElseThrow(() -> ApiException.badRequest("Invalid request"));

            updatePassword(user, request.getNewPassword());
            refreshTokenService.revokeAll(user.getId());
            tokenInvalidationRegistry.invalidateNow(user.getId());
            auditLogService.log("PASSWORD_RESET", "USER", user.getId(), user.getBotleagueId(), null, null);
        }
        // ----- EMAIL TOKEN FLOW -----
        else if (request.getToken() != null) {
            PasswordResetToken resetToken = passwordResetTokenRepository
                    .findByToken(request.getToken())
                    .orElseThrow(() -> ApiException.badRequest("Invalid token"));

            if (resetToken.getUsedAt() != null) {
                throw ApiException.badRequest("Token already used");
            }
            if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw ApiException.badRequest("Token expired");
            }

            User user = userRepository.findById(resetToken.getUserId())
                    .orElseThrow(() -> ApiException.notFound("User not found"));

            updatePassword(user, request.getNewPassword());
            refreshTokenService.revokeAll(user.getId());
            tokenInvalidationRegistry.invalidateNow(user.getId());
            auditLogService.log("PASSWORD_RESET", "USER", user.getId(), user.getBotleagueId(), null, null);

            resetToken.setUsedAt(LocalDateTime.now());
            passwordResetTokenRepository.save(resetToken);
        } else {
            throw ApiException.badRequest("Invalid request");
        }
    }

    // ================= CHANGE PASSWORD =================

    @Transactional
    public void changePassword(ChangePasswordRequestDTO request, String userId) {

        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!passwordHasher.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid current password");
        }

        updatePassword(user, request.getNewPassword());
        refreshTokenService.revokeAll(user.getId()); // log out other sessions
    }

    // ================= COMMON PASSWORD UPDATE =================

    private void updatePassword(User user, String newPassword) {
        if (newPassword == null || newPassword.isBlank()) {
            throw ApiException.badRequest("New password required");
        }
        String hashedPassword = passwordHasher.hash(newPassword);
        user.setPasswordHash(hashedPassword);
        // BUG FIX: do NOT set deletedAt here. The old code soft-deleted every
        // account that changed or reset its password.
        userRepository.save(user);
    }

    // ================= CREATE EMAIL TOKEN =================

    private void createPasswordResetToken(User user) {
        passwordResetTokenRepository.deleteByUserId(user.getId());

        PasswordResetToken token = new PasswordResetToken();
        token.setUserId(user.getId());
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        token.setCreatedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(token);

        // Send the email AFTER the DB transaction commits so a slow SMTP call
        // never holds a pooled connection (the pool is only ~5 connections).
        String email = user.getEmail();
        String rawToken = token.getToken();
        afterCommit(() -> emailService.sendPasswordResetEmail(email, rawToken));
    }

    // ================= GET CURRENT USER =================

    @Transactional(readOnly = true)
    public MeResponseDTO getCurrentUser(String userId) {
        UUID uid = UUID.fromString(userId);
        User user = userRepository.findById(uid)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        List<UserRole> userRoles = userRoleRepository.findByUserId(uid);
        List<String> roleNames = userRoles.stream()
                .map(r -> r.getRoleType().name())
                .collect(Collectors.toList());
        if (roleNames.isEmpty() && user.getAccountType() != null) {
            roleNames = List.of(user.getAccountType().name());
        }

        String primaryRole = userRoles.stream()
                .map(UserRole::getRoleType)
                .min(java.util.Comparator.comparingInt(r ->
                        ROLE_PRIORITY.indexOf(r) == -1 ? Integer.MAX_VALUE : ROLE_PRIORITY.indexOf(r)))
                .map(AccountType::name)
                .orElse(user.getAccountType() != null ? user.getAccountType().name() : AccountType.COMPETITOR.name());

        List<ResourceRoleAssignment> approvedAssignments = resourceRoleAssignmentRepository
                .findByUserIdAndStatus(uid, ResourceRoleAssignment.STATUS_APPROVED);

        List<String> eventIds = approvedAssignments.stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_EVENT.equals(a.getScopeType()))
                .map(a -> a.getScopeId().toString())
                .collect(Collectors.toList());

        List<String> sportIds = approvedAssignments.stream()
                .filter(a -> ResourceRoleAssignment.SCOPE_SPORT.equals(a.getScopeType()))
                .map(a -> a.getScopeId().toString())
                .collect(Collectors.toList());

        MeResponseDTO response = new MeResponseDTO();
        response.setBotleagueId(user.getBotleagueId());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(primaryRole);
        response.setAllRoles(roleNames);
        response.setAssignedEventIds(eventIds);
        response.setAssignedSportIds(sportIds);
        response.setPhoneVerified(user.isPhoneVerified());
        return response;
    }

    // ================= HELPERS =================

    // Package-private (not private): GoogleAuthService, in this same package,
    // reuses this so a Google sign-in issues the exact same JWT + refresh
    // token shape as every other login path.
    AuthTokensDTO issueTokens(User user, String botleagueId) {
        String access = jwtService.generateAccessToken(user.getId().toString(), getUserRoles(user));
        String refresh = refreshTokenService.issue(user.getId());
        return new AuthTokensDTO(access, refresh, botleagueId);
    }

    private List<String> getUserRoles(User user) {
        List<String> roles = userRoleRepository.findByUserId(user.getId()).stream()
                .map(r -> r.getRoleType().name())
                .collect(Collectors.toList());
        // Fall back to legacy accountType if no roles assigned yet
        if (roles.isEmpty() && user.getAccountType() != null) {
            roles = List.of(user.getAccountType().name());
        }
        return roles;
    }

    /** Runs work only if/when the current transaction commits successfully. */
    private void afterCommit(Runnable work) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            work.run();
                        }
                    });
        } else {
            work.run();
        }
    }
}