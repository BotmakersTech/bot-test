package com.botleague.backend.team.dto;

import java.util.UUID;

import com.botleague.backend.team.enums.RobotStatus;

public class CreateRobotResponseDTO {

    private UUID id;
    private String robotCode;
    private String robotName;
    private RobotStatus status;
	public UUID getId() {
		return id;
	}
	
	public void setId(UUID id) {
		 this.id=id;
	}
	
	public String getRobotCode() {
		return robotCode;
	}
	public void setRobotCode(String robotCode) {
		this.robotCode = robotCode;
	}
	public String getRobotName() {
		return robotName;
	}
	public void setRobotName(String robotName) {
		this.robotName = robotName;
	}
	public RobotStatus getStatus() {
		return status;
	}
	public void setStatus(RobotStatus status) {
		this.status = status;
	}

   
}