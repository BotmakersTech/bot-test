package com.botleague.backend.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class AdminJudgeAssignmentDTOs {

    /** One event this judge is onboarded to, plus the sport (if any) they're granted to score. */
    public static class JudgeEventAssignmentResponse {
        public UUID eventJudgeId;
        public UUID eventId;
        public String eventName;
        public Boolean scoringRights;
        public LocalDateTime createdAt;
        public UUID assignedSportId;
        public String assignedSportName;
    }

    public static class AssignJudgeToEventRequest {
        public UUID eventId;
    }

    /** eventSportId = null clears the judge's sport assignment. */
    public static class AssignSportRequest {
        public UUID eventSportId;
    }

    /** One sport within the event, offered as an assignment target. */
    public static class EventSportOptionResponse {
        public UUID eventSportId;
        public String sportName;
        public int matchCount;
    }
}
