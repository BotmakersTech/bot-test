package com.botleague.backend.profile.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.auth.service.OtpService;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.EmailService;
import com.botleague.backend.common.service.GetFileService;
import com.botleague.backend.profile.dto.ChangePhoneRequestDTO;
import com.botleague.backend.profile.dto.ProfileResponseDTO;
import com.botleague.backend.profile.dto.UpdateProfileRequestDTO;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final GetFileService getFileService;
    private final EmailService emailService;
    private final OtpService otpService;

    public UserProfileService(
            UserRepository userRepository,
            GetFileService getFileService,
            EmailService emailService,
            OtpService otpService) {
        this.userRepository = userRepository;
        this.getFileService = getFileService;
        this.emailService = emailService;
        this.otpService = otpService;
    }

    // ================= GET PROFILE =================

    @Transactional(readOnly = true)
    public ProfileResponseDTO getMyProfile(Authentication authentication) {

        User user = extractUser(authentication);
        return mapToProfileDTO(user);
    }

    // ================= UPDATE PROFILE =================

    @Transactional
    public ProfileResponseDTO updateProfile(
            Authentication authentication,
            UpdateProfileRequestDTO request) {

        User user = extractUser(authentication);

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getProfilePhotoUrl() != null) {
            user.setProfilePhotoUrl(request.getProfilePhotoUrl());
        }
        if (request.getCountry() != null) {
            user.setCountry(request.getCountry());
        }
        if (request.getState() != null) {
            user.setState(request.getState());
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        userRepository.save(user);
        return mapToProfileDTO(user);
    }

    // ================= UPDATE PROFILE PHOTO =================

    @Transactional
    public void updateProfilePhoto(Authentication authentication, String fileUrl) {

        User user = extractUser(authentication);
        user.setProfilePhotoUrl(fileUrl);
        userRepository.save(user);
    }

    // ================= GET USER BY ID =================

    @Transactional(readOnly = true)
    public User getUserById(UUID userId) {

        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    // ================= ADD USERNAME =================

    @Transactional
    public String addUsername(Authentication authentication, String username) {

        String normalizedUsername = username.trim().toLowerCase();

        User user = extractUser(authentication);

        if (normalizedUsername.equals(user.getUsername())) {
            throw ApiException.badRequest("Username is already set to this value");
        }

        boolean exists = userRepository.existsByUsername(normalizedUsername);
        if (exists) {
            throw ApiException.conflict("Username already taken");
        }

        user.setUsername(normalizedUsername);
        userRepository.save(user);

        return normalizedUsername;
    }

    // ================= UPDATE EMAIL =================

    @Transactional
    public String updateEmail(Authentication authentication, String newEmail) {

        User user = extractUser(authentication);

        String normalizedEmail = newEmail.trim().toLowerCase();

        if (normalizedEmail.equals(user.getEmail())) {
            throw ApiException.conflict("New email cannot be same as current email");
        }

        boolean exists = userRepository.existsByEmail(normalizedEmail);
        if (exists) {
            throw ApiException.conflict("Email already registered");
        }

        String token = UUID.randomUUID().toString();

        user.setPendingEmail(normalizedEmail);
        user.setEmailVerificationToken(token);
        user.setEmailVerificationExpiry(LocalDateTime.now().plusMinutes(15));
        user.setEmailVerified(false);
        userRepository.save(user);

        // Send email AFTER transaction commits so a slow SMTP call
        // never holds a pooled DB connection.
        afterCommit(() -> emailService.sendVerificationEmail(normalizedEmail, token));

        return "Verification email sent successfully";
    }

    // ================= VERIFY EMAIL =================

    @Transactional
    public String verifyEmail(String token) {

        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> ApiException.badRequest("Invalid verification token"));

        if (user.getEmailVerificationExpiry() == null
                || user.getEmailVerificationExpiry().isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("Verification token expired");
        }

        user.setEmail(user.getPendingEmail());
        user.setPendingEmail(null);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiry(null);
        user.setEmailVerified(true);
        userRepository.save(user);

        return "Email verified successfully";
    }

    // ================= HELPERS =================

    /**
     * Extracts userId (String) from the JWT principal, looks up the User.
     * The new JwtAuthenticationFilter sets userId as the principal,
     * NOT the User entity — so we cast to String, not to User.
     */
    private User extractUser(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private ProfileResponseDTO mapToProfileDTO(User user) {

        ProfileResponseDTO dto = new ProfileResponseDTO();

        dto.setId(user.getId());
        dto.setBotleagueId(user.getBotleagueId());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setUserName(user.getUsername());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setGender(user.getGender());
        dto.setDateOfBirth(user.getDateOfBirth());

        String key = user.getProfilePhotoUrl();
        String url = (key != null) ? getFileService.getPublicUrl(key) : null;
        dto.setProfilePhotoUrl(url);

        dto.setCountry(user.getCountry());
        dto.setState(user.getState());
        dto.setCity(user.getCity());
        dto.setAddress(user.getAddress());
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }

    // ================= CHANGE PHONE =================

    @Transactional
    public void changePhone(Authentication authentication, ChangePhoneRequestDTO request) {
        otpService.verifyOtp(request.getNewPhone(), request.getOtp());

        if (userRepository.existsByPhone(request.getNewPhone())) {
            throw ApiException.conflict("Phone number already in use");
        }

        User user = extractUser(authentication);
        user.setPhone(request.getNewPhone());
        userRepository.save(user);
    }

    /** Runs work only after the current transaction commits successfully. */
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