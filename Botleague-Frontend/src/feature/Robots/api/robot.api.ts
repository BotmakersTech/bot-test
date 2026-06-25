import api from "../../../shared/api/Base";
import type { Robot } from "../types/types";

// ======================================================
// CREATE ROBOT
// ======================================================

export interface CreateRobotPayload {
  robotName: string;
  robotType: string;          // RobotType enum value (e.g. COMBAT_ROBOT, SOCCER_ROBOT)
  sport: string;              // RobotSport key (e.g. ROBOWAR_1_5KG, ROBO_SOCCER)
  controlType: string;        // MANUAL | AUTONOMOUS | HYBRID
  controlMode: string;        // WIRED | WIRELESS
  weightClass?: string;       // auto-derived for RoboWar sports
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  attributes?: Record<string, string>;
  description: string;
}

export interface CreateRobotResponseDTO {
  id: string;
  robotCode: string;
  robotName: string;
  status: string;
}

// ======================================================
// UPDATE ROBOT PAYLOAD (all fields optional — patch semantics)
// ======================================================

export interface UpdateRobotPayload {
  robotName?: string;
  robotType?: string;
  sport?: string;
  weightClass?: string;
  weightKg?: number;
  controlType?: string;
  controlMode?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  attributes?: Record<string, string>;
  description?: string;
  status?: string;
}

// ======================================================
// GET TEAM ROBOTS
// ======================================================

export const getRobotsOfCurrentTeam = async (
  teamCode: string
): Promise<Robot[]> => {
  const res = await api.get(`/robots/${teamCode}/all-robots`);
  return res.data;
};

// ======================================================
// CREATE ROBOT
// ======================================================

export const createRobot = async (
  payload: CreateRobotPayload
): Promise<CreateRobotResponseDTO> => {
  const res = await api.post("/robots/createRobots", payload);
  return res.data;
};

// ======================================================
// GET ROBOT BY ID
// ======================================================

export const getRobotById = async (robotId: string): Promise<Robot> => {
  const res = await api.get(`/robots/${robotId}/robot`);
  return res.data;
};

// ======================================================
// UPDATE ROBOT
// ======================================================

export const updateRobot = async (
  robotId: string,
  payload: UpdateRobotPayload
): Promise<Robot> => {
  const res = await api.patch(`/robots/update-robot/${robotId}`, payload);
  return res.data;
};

// ======================================================
// DELETE ROBOT
// ======================================================

export const deleteRobot = async (robotId: string): Promise<string> => {
  const res = await api.delete(`/robots/${robotId}/delete-robot`);
  return res.data;
};
