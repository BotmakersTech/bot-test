package com.botleague.backend.readiness.dto;

import java.util.UUID;

public class UpdateReadinessRequest {

    private UUID registrationId;
    private Boolean ready;
    private Boolean arrivedAtVenue;
    private Boolean robotChecked;
    private Boolean batteryCharged;
    private Boolean equipmentVerified;

    public UUID getRegistrationId() { return registrationId; }
    public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

    public Boolean getReady() { return ready; }
    public void setReady(Boolean ready) { this.ready = ready; }

    public Boolean getArrivedAtVenue() { return arrivedAtVenue; }
    public void setArrivedAtVenue(Boolean arrivedAtVenue) { this.arrivedAtVenue = arrivedAtVenue; }

    public Boolean getRobotChecked() { return robotChecked; }
    public void setRobotChecked(Boolean robotChecked) { this.robotChecked = robotChecked; }

    public Boolean getBatteryCharged() { return batteryCharged; }
    public void setBatteryCharged(Boolean batteryCharged) { this.batteryCharged = batteryCharged; }

    public Boolean getEquipmentVerified() { return equipmentVerified; }
    public void setEquipmentVerified(Boolean equipmentVerified) { this.equipmentVerified = equipmentVerified; }
}
