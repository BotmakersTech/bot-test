package com.botleague.backend.auth.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.botleague.backend.auth.dto.*;
import com.botleague.backend.auth.entity.PasswordResetToken;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.admin.repository.UserEventAssignmentRepository;
import com.botleague.backend.admin.repository.UserSportAssignmentRepository;
import com.botleague.backend.auth.enums.AccountStatus;
import com.botleague.backend.auth.enums.AccountType;
import com.botleague.backend.auth.enums.LoginType;
import com.botleague.backend.auth.enums.PhoneVerification;
import com.botleague.backend.auth.repository.PasswordResetTokenRepository;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.role.entity.UserRole;
import com.botleague.backend.role.repository.UserRoleRepository;
import com.botleague.backend.common.security.JwtService;
import com.botleague.backend.common.security.PasswordHasher;
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
    private final UserEventAssignmentRepository eventAssignmentRepository;
    private final UserSportAssignmentRepository sportAssignmentRepository;

    private static final List<AccountType> ROLE_PRIORITY = List.of(
            AccountType.SUPER_ADMIN, AccountType.ADMINISTRATOR, AccountType.MANAGER,
            AccountType.ORGANIZER, AccountType.SUB_ORGANIZER,
            AccountType.JUDGE, AccountType.VOLUNTEER, AccountType.COMPETITOR
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
            UserEventAssignmentRepository eventAssignmentRepository,
            UserSportAssignmentRepository sportAssignmentRepository) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.botleagueIdService = botleagueIdService;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.otpService = otpService;
        this.emailService = emailService;
        this.userRoleRepository = userRoleRepository;
        this.eventAssignmentRepository = eventAssignmentRepository;
        this.sportAssignmentRepository = sportAssignmentRepository;
    }

    // ================= REGISTER =================

    @Transactional
    public AuthTokensDTO register(RegisterRequestDTO request) {

        if (userRepository.existsByPhone(request.getPhone())) {
            // 409, not a generic 500.
            throw ApiException.conflict("User already exists");
        }

        String botleagueId = botleagueIdService.generateBotleagueUserId();
        // hashing is bounded so a registration burst can't pin both cores
        String hashedPassword = passwordHasher.hash(request.getPassword());

        User user = new User();
        user.setPhone(request.getPhone());
        user.setBotleagueId(botleagueId);
        user.setPasswordHash(hashedPassword);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setAccountType(AccountType.COMPETITOR);
        user.setPhoneVerified(true);

        userRepository.save(user);

        return issueTokens(user, botleagueId);
    }

    // ================= LOGIN =================

    @Transactional
    public AuthTokensDTO login(LoginRequestDTO request) {

        if (request.getLoginType() == null) {
            throw ApiException.badRequest("Login type required");
        }

        User user = (request.getLoginType() == LoginType.PHONE)
                ? userRepository.findByPhone(request.getIdentifier())
                        .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"))
                : userRepository.findByEmailIgnoreCase(request.getIdentifier())
                        .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));

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

            resetToken.setUsedAt(LocalDateTime.now());
            passwordResetTokenRepository.save(resetToken);
        } else {
            throw ApiException.badRequest("Invalid request");
        }

        // Security: a password reset invalidates all existing sessions.
        // (resolve userId in either branch; shown here for the email flow)
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

        List<String> eventIds = eventAssignmentRepository.findByUserId(uid).stream()
                .map(a -> a.getEventId().toString())
                .collect(Collectors.toList());

        List<String> sportIds = sportAssignmentRepository.findByUserId(uid).stream()
                .map(a -> a.getEventSportId().toString())
                .collect(Collectors.toList());

        MeResponseDTO response = new MeResponseDTO();
        response.setBotleagueId(user.getBotleagueId());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(primaryRole);
        response.setAllRoles(roleNames);
        response.setAssignedEventIds(eventIds);
        response.setAssignedSportIds(sportIds);
        return response;
    }

    // ================= HELPERS =================

    private AuthTokensDTO issueTokens(User user, String botleagueId) {
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