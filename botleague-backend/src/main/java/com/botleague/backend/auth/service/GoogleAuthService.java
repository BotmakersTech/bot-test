package com.botleague.backend.auth.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import com.botleague.backend.auth.dto.AuthTokensDTO;
import com.botleague.backend.auth.dto.GoogleAuthRequestDTO;
import com.botleague.backend.auth.entity.User;
import com.botleague.backend.auth.enums.AccountStatus;
import com.botleague.backend.auth.enums.AuthProvider;
import com.botleague.backend.auth.repository.UserRepository;
import com.botleague.backend.common.exception.ApiException;
import com.botleague.backend.common.service.BotleagueIdService;

/**
 * Verifies a Google Identity Services ID token (frontend's <GoogleLogin>
 * credential) and resolves it to a User, then hands off to AuthService for
 * the same JWT + refresh-cookie issuance every other login path uses.
 */
@Service
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final BotleagueIdService botleagueIdService;
    private final AuthService authService;
    private final GoogleIdTokenVerifier verifier;

    public GoogleAuthService(
            UserRepository userRepository,
            BotleagueIdService botleagueIdService,
            AuthService authService,
            @Value("${google.oauth.client-id}") String googleClientId) {
        this.userRepository = userRepository;
        this.botleagueIdService = botleagueIdService;
        this.authService = authService;
        try {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
        } catch (GeneralSecurityException | IOException e) {
            // Same fail-fast-at-startup posture as JwtService validating its
            // secret length — a broken Google verifier should never come up silently.
            throw new IllegalStateException("Failed to initialize Google ID token verifier", e);
        }
    }

    @Transactional
    public AuthTokensDTO authenticate(GoogleAuthRequestDTO request) {
        GoogleIdToken.Payload payload = verify(request.getIdToken());

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());

        User user = userRepository.findByGoogleId(googleId).orElse(null);

        if (user == null && email != null && emailVerified) {
            // Auto-link: an email Google itself has verified, matching an
            // existing platform-verified email (User.email is only ever set
            // after token-based verification, see UserProfileService.verifyEmail),
            // is treated as the same person rather than creating a duplicate.
            // Gated on Google's own email_verified claim — an unverified
            // email claim must never be trusted to link into someone else's
            // account.
            user = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (user != null) {
                user.setGoogleId(googleId);
            }
        }

        if (user == null) {
            user = new User();
            user.setGoogleId(googleId);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setBotleagueId(botleagueIdService.generateBotleagueUserId());
            user.setAccountStatus(AccountStatus.ACTIVE);
            user.setPhoneVerified(false);
            if (email != null) {
                user.setEmail(email);
                user.setEmailVerified(emailVerified);
            }
            user.setFirstName((String) payload.get("given_name"));
            user.setLastName((String) payload.get("family_name"));
            user.setProfilePhotoUrl((String) payload.get("picture"));
        }

        userRepository.save(user);

        // An existing account found by googleId/email might not be ACTIVE
        // (e.g. ORGANISER/JUDGE still awaiting admin approval, or suspended)
        // — mirror AuthService.login's check so re-authenticating with Google
        // can't bypass that gate.
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw ApiException.forbidden("Account inactive");
        }

        return authService.issueTokens(user, user.getBotleagueId());
    }

    private GoogleIdToken.Payload verify(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw ApiException.unauthorized("Invalid Google sign-in");
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | IOException e) {
            throw ApiException.unauthorized("Invalid Google sign-in");
        }
    }
}
