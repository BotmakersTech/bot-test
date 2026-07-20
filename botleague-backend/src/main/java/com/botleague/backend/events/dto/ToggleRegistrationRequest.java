package com.botleague.backend.events.dto;

import java.time.LocalDate;

/**
 * Optional body for PATCH /{sportId}/registration. When reopening a sport's
 * registration, the caller may supply the new window's end date explicitly —
 * if omitted, a default (today + 7 days, IST) is used. See
 * EventSportsService.updateSportsRegistration's javadoc for why this can't
 * just be left null and back-filled conditionally.
 */
public class ToggleRegistrationRequest {

    private LocalDate newRegistrationEndDate;

    public LocalDate getNewRegistrationEndDate() { return newRegistrationEndDate; }
    public void setNewRegistrationEndDate(LocalDate newRegistrationEndDate) {
        this.newRegistrationEndDate = newRegistrationEndDate;
    }
}
