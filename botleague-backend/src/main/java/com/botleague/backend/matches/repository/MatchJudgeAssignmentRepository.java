package com.botleague.backend.matches.repository;

import com.botleague.backend.matches.entity.MatchJudgeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchJudgeAssignmentRepository extends JpaRepository<MatchJudgeAssignment, UUID> {
    boolean existsByMatchIdAndJudgeUserId(UUID matchId, UUID judgeUserId);
    List<MatchJudgeAssignment> findByJudgeUserId(UUID judgeUserId);
    List<MatchJudgeAssignment> findByMatchId(UUID matchId);
    void deleteByMatchIdAndJudgeUserId(UUID matchId, UUID judgeUserId);
}
