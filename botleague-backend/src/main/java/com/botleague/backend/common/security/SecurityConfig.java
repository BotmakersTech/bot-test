package com.botleague.backend.common.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

/**
 * Spring Security configuration — NO role hierarchy.
 *
 * Every endpoint declares its own explicit role list via @PreAuthorize.
 * Roles are flat and independent; no role automatically inherits
 * the permissions of another.
 *
 * Roles (AccountType):
 *   SUPER_ADMIN     — unrestricted platform access
 *   ADMINISTRATOR   — user mgmt, event creation, sport-spec changes
 *   MANAGER         — event operations, registrations, matches, reports
 *   ORGANIZER       — assigned-event management
 *   SUB_ORGANIZER   — assigned-sport management within an event
 *   COMPETITOR      — regular competitor / platform user
 *   JUDGE           — scoring rights for assigned matches
 *   VOLUNTEER       — event volunteer check-in / view
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/profile/verify-email", "/error").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/teams/public/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/robots/public/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/profile/public/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/Events/live").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/Events/completed").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/Events/*/support-contacts").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/events/*/sports/*/support-contacts").permitAll()
                .requestMatchers("/ws/chat/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/rankings/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/sponsors/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/event-sponsors/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/sport-sponsors/**").permitAll()
                // Live bracket/match results — spectators should be able to watch a
                // tournament without an account, matching what the platform already
                // does for live/completed event listings above.
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/matches/**").permitAll()
                // QR / shared-link certificate verification — the entire point is that
                // anyone holding the link or scanning the code can check authenticity
                // without an account.
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/certificates/verify/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) ->
                    res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                .accessDeniedHandler((req, res, e) ->
                    res.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden"))
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder(@Value("${security.bcrypt.strength:10}") int strength) {
        return new BCryptPasswordEncoder(strength);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://test.botleague.in", "http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
