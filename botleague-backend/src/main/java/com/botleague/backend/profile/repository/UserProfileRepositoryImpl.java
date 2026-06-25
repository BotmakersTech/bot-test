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
                u.full_name,
                u.profile_photo_url,
                t.team_name,
                t.team_logo_url
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
        dto.setName((String) basic[1]);
        dto.setProfileImageUrl((String) basic[2]);
        dto.setTeamName((String) basic[3]);
        dto.setTeamLogoUrl((String) basic[4]);

        // =========================
        // 2. TEAM ROLE (Driver / Programmer)
        // =========================
        List<?> roleResult = em.createNativeQuery("""
            SELECT ls.role_in_event
            FROM lineup_snapshots ls
            JOIN registrations r ON r.id = ls.registration_id
            WHERE ls.user_id = :userId
            ORDER BY r.created_at DESC
            LIMIT 1
        """)
        .setParameter("userId", userId)
        .getResultList();

        if (!roleResult.isEmpty()) {
            dto.setTeamRole((String) roleResult.get(0));
        }

        // =========================
        // 3. TOURNAMENTS PLAYED
        // =========================
        Number tournaments = (Number) em.createNativeQuery("""
            SELECT COUNT(DISTINCT r.competition_id)
            FROM registrations r
            JOIN team_memberships tm ON tm.team_id = r.team_id
            WHERE tm.user_id = :userId
        """)
        .setParameter("userId", userId)
        .getSingleResult();

        dto.setTournamentsPlayed(tournaments.intValue());

        // =========================
        // 4. MATCHES PLAYED
        // =========================
        Number matches = (Number) em.createNativeQuery("""
            SELECT COUNT(*)
            FROM match_participants mp
            JOIN registrations r ON r.id = mp.registration_id
            JOIN team_memberships tm ON tm.team_id = r.team_id
            WHERE tm.user_id = :userId
        """)
        .setParameter("userId", userId)
        .getSingleResult();

        int matchesPlayed = matches.intValue();
        dto.setMatchesPlayed(matchesPlayed);

        // =========================
        // 5. WINS / LOSSES
        // =========================
        Object[] wl = (Object[]) em.createNativeQuery("""
            SELECT 
                SUM(CASE WHEN fms.aggregated_score = winner.max_score THEN 1 ELSE 0 END),
                SUM(CASE WHEN fms.aggregated_score < winner.max_score THEN 1 ELSE 0 END)
            FROM final_match_scores fms
            JOIN (
                SELECT match_id, MAX(aggregated_score) AS max_score
                FROM final_match_scores
                GROUP BY match_id
            ) winner ON winner.match_id = fms.match_id
            JOIN registrations r ON r.id = fms.registration_id
            JOIN team_memberships tm ON tm.team_id = r.team_id
            WHERE tm.user_id = :userId
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
        // =========================
        List<Object[]> rows = em.createNativeQuery("""
            SELECT 
                c.name,
                t.team_name,
                ls.role_in_event,
                cs.age_group,
                lb.rank
            FROM registrations r
            JOIN competitions c ON c.id = r.competition_id
            JOIN teams t ON t.id = r.team_id
            JOIN lineup_snapshots ls 
                ON ls.registration_id = r.id AND ls.user_id = :userId
            JOIN competition_sports cs ON cs.id = r.competition_sport_id
            LEFT JOIN leaderboard lb 
                ON lb.team_id = t.id AND lb.competition_id = c.id
            ORDER BY c.start_date DESC
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
}