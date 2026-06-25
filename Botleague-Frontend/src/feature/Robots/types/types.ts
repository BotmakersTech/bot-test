export type RobotType =
  | "COMBAT_ROBOT"
  | "SOCCER_ROBOT"
  | "SUMO_ROBOT"
  | "LINE_FOLLOWER_ROBOT"
  | "TASK_ROBOT"
  | "RC_VEHICLE"
  | "DRONE"
  | "AIRCRAFT"
  | "INNOVATION_PROJECT";

export type RobotSport =
  | "ROBOWAR_1_5KG"
  | "ROBOWAR_8KG"
  | "ROBOWAR_15KG"
  | "ROBOWAR_30KG"
  | "ROBOWAR_60KG"
  | "ROBO_SOCCER"
  | "PLUG_N_PLAY_SOCCER"
  | "ROBO_SUMO"
  | "LINE_FOLLOWER"
  | "LINE_FOLLOWER_AUTO"
  | "MANUAL_TASK"
  | "THEME_BASED_TASKING"
  | "DRONE_RACING"
  | "DRONE_SOCCER"
  | "RC_RACING"
  | "AEROMODELLING"
  | "PROJECT_BASED";

export type AgeCategory =
  | "JUNIOR_INNOVATORS"
  | "YOUNG_ENGINEERS"
  | "ROBO_MINDS";

export type ControlType = "MANUAL" | "AUTONOMOUS" | "HYBRID";

export type ControlMode = "WIRED" | "WIRELESS";

export type RobotStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface Robot {
  id: string;
  robotCode: string;
  robotName: string;
  robotType: RobotType;
  sport: RobotSport | string;
  eligibleCategories: AgeCategory[];
  weightClass?: string;
  weightKg?: number;
  controlType: ControlType;
  controlMode?: ControlMode;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  attributes?: Record<string, string>;
  description: string;
  status: RobotStatus;
  teamId: string;
  createdAt: string;
  updatedAt?: string;
  robotIMG?: string;
}
