package com.botleague.backend.admin.dto;

import com.botleague.backend.matches.dto.MatchResponseDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class AdminJudgeAssignmentDTOs {

    /** One event this judge is onboarded to, plus which of that event's matches they can score. */
    public static class JudgeEventAssignmentResponse {
        public UUID eventJudgeId;
        public UUID eventId;
        public String eventName;
        public Boolean scoringRights;
        public LocalDateTime createdAt;
        public List<UUID> assignedMatchIds;
    }

    public static class AssignJudgeToEventRequest {
        public UUID eventId;
    }

    /** One sport within the event, and the matches generated for it so far. */
    public static class SportMatchesResponse {
        public UUID eventSportId;
        public String sportName;
        public List<MatchResponseDTO> matches;
    }
}
