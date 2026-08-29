package com.botleague.backend.profile.repository;

import java.util.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.stereotype.Repository;

import com.botleague.backend.profile.dto.PublicProfileResponseDTO;

@Repository
public class UserProfileRepositoryImpl implements UserProfileRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    public PublicProfileResponseDTO getPublicProfile(UUID userId) {

        PublicProfileResponseDTO dto = new PublicProfileResponseDTO();

        // =========================
        // 1. BASIC INFO + TEAM
        // =========================
        Object[] basic = (Object[]) em.createNativeQuery("""
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.profile_photo_url,
                t.team_name,
                t.logo_url
            FROM users u
            LEFT JOIN team_memberships tm
                ON tm.user_id = u.id AND tm.status = 'ACTIVE'
            LEFT JOIN teams t
                ON t.id = tm.team_id
            WHERE u.id = :userId
        """)
        .setParameter("userId", userId)
        .getSingleResult();

        dto.setUserId((UUID) basic[0]);
        String firstName = (String) basic[1];
        String lastName = (String) basic[2];
        dto.setName(joinName(firstName, lastName));
        dto.setProfileImageUrl((String) basic[3]);
        dto.setTeamName((String) basic[4]);
        dto.setTeamLogoUrl((String) basic[5]);

        // =========================
        // 2. TEAM ROLE (Driver / Build Head / ...)
        // — most recently assigned active lineup role for this person.
        // =========================
        List<?> roleResult = em.createNativeQuery("""
            SELECT erl.lineup_role
            FROM event_registration_lineups erl
            JOIN team_memberships tm ON tm.id = erl.team_membership_id
            WHERE tm.user_id = :userId AND erl.is_active = true
            ORDER BY erl.created_at DESC
            LIMIT 1
        """)
        .setParameter("userId", userId)
        .getResultList();

        if (!roleResult.isEmpty()) {
            dto.setTeamRole((String) roleResult.get(0));
        }

        // =========================
        // 3. TOURNAMENTS PLAYED
        // — distinct events any of this person's teams registered a robot into.
        // =========================
        Number tournaments = (Number) em.createNativeQuery("""
            SELECT COUNT(DISTINCT sr.event_id)
            FROM sport_registrations sr
            JOIN team_memberships tm ON tm.team_id = sr.team_id
            WHERE tm.user_id = :userId
        """)
        .setParameter("userId", userId)
        .getSingleResult();

        dto.setTournamentsPlayed(tournaments.intValue());

        // =========================
        // 4. MATCHES PLAYED
        // — completed matches involving a registration owned by any of this
        // person's teams. A registration id can sit in any of the four
        // team-slot columns depending on match type (1v1 / triple threat /
        // fatal four).
        // =========================
        Number matches = (Number) em.createNativeQuery("""
            SELECT COUNT(*)
            FROM matches m
            JOIN sport_registrations r
                ON r.id IN (m.team_a_registration_id, m.team_b_registration_id,
                             m.team_c_registration_id, m.team_d_registration_id)
            JOIN team_memberships tm ON tm.team_id = r.team_id
            WHERE tm.user_id = :userId
              AND m.deleted_at IS NULL
              AND m.status = 'COMPLETED'
        """)
        .setParameter("userId", userId)
        .getSingleResult();

        int matchesPlayed = matches.intValue();
        dto.setMatchesPlayed(matchesPlayed);

        // =========================
        // 5. WINS / LOSSES
        // — winner_registration_id is set on match completion; null means a
        // genuine tie / no-winner outcome, which counts as neither.
        // =========================
        Object[] wl = (Object[]) em.createNativeQuery("""
            SELECT
                SUM(CASE WHEN m.winner_registration_id = r.id THEN 1 ELSE 0 END),
                SUM(CASE WHEN m.winner_registration_id IS NOT NULL
                          AND m.winner_registration_id <> r.id THEN 1 ELSE 0 END)
            FROM matches m
            JOIN sport_registrations r
                ON r.id IN (m.team_a_registration_id, m.team_b_registration_id,
                             m.team_c_registration_id, m.team_d_registration_id)
            JOIN team_memberships tm ON tm.team_id = r.team_id
            WHERE tm.user_id = :userId
              AND m.deleted_at IS NULL
              AND m.status = 'COMPLETED'
        """)
        .setParameter("userId", userId)
        .getSingleResult();

        int wins = wl[0] != null ? ((Number) wl[0]).intValue() : 0;
        int losses = wl[1] != null ? ((Number) wl[1]).intValue() : 0;

        dto.setWins(wins);
        dto.setLosses(losses);

        // =========================
        // 6. WIN RATE
        // =========================
        dto.setWinRate(matchesPlayed > 0 ? (wins * 100.0) / matchesPlayed : 0.0);

        // =========================
        // 7. PLAYER HISTORY
        // — anchored on this person's own lineup entries (person + robot +
        // competition), so the leaderboard rank joined in is THIS robot's
        // rank, not an ambiguous pick among a team's several robots.
        // =========================
        List<Object[]> rows = em.createNativeQuery("""
            SELECT
                e.event_name,
                t.team_name,
                erl.lineup_role,
                es.age_group,
                lb.event_rank
            FROM event_registration_lineups erl
            JOIN team_memberships tm ON tm.id = erl.team_membership_id
            JOIN events e ON e.id = erl.event_id
            JOIN teams t ON t.id = erl.team_id
            JOIN event_sports es ON es.id = erl.event_sport_id
            LEFT JOIN event_leaderboard_entries lb
                ON lb.event_sport_id = erl.event_sport_id AND lb.robot_id = erl.robot_id
            WHERE tm.user_id = :userId AND erl.is_active = true
            ORDER BY e.start_date DESC
        """)
        .setParameter("userId", userId)
        .getResultList();

        List<PublicProfileResponseDTO.PlayerHistoryDTO> historyList = new ArrayList<>();

        for (Object[] row : rows) {
            PublicProfileResponseDTO.PlayerHistoryDTO h = new PublicProfileResponseDTO.PlayerHistoryDTO();

            h.setTournamentName((String) row[0]);
            h.setTeamName((String) row[1]);
            h.setRole((String) row[2]);
            h.setTier((String) row[3]);

            Integer rank = row[4] != null ? ((Number) row[4]).intValue() : null;
            h.setPosition(rank);

            if (rank != null) {
                if (rank == 1) h.setResultLabel("Winner");
                else if (rank == 2) h.setResultLabel("Runner-up");
                else if (rank == 3) h.setResultLabel("3rd Place");
                else h.setResultLabel("Participant");
            }

            historyList.add(h);
        }

        dto.setPlayerHistory(historyList);

        return dto;
    }

    private static String joinName(String firstName, String lastName) {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();
        String full = (first + " " + last).trim();
        return full.isEmpty() ? null : full;
    }
}
