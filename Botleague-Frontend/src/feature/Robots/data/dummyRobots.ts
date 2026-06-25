// import combatRobot from "../../assets/Robo1.png";
// import racingRobot from "../../assets/Robo2.png";
// import lineRobot from "../../assets/Robo3.png";
// import type {
//   Robot,
//   RobotCategory,
//   RobotStatus,
//   ControlType,
// } from "../types/types";
// export const dummyRobots: Robot[] = [
//   {
//     id: "1",
//     robotCode: "RBT-001",
//     robotName: "IronStrike X1",
//     category: "COMBAT",
//     weightClass: "Heavyweight (>10kg)",
//     controlType: "REMOTE",
//     description: "A powerful combat robot built for destruction. Equipped with a spinning blade and reinforced titanium shell for maximum durability in arena battles.",
//     status: "ACTIVE",
//     teamId: "team-001",
//     createdAt: "2024-01-15T10:00:00Z",
//     updatedAt: "2024-03-20T14:00:00Z",
//     imageUrl: combatRobot,
//   },
//   {
//     id: "2",
//     robotCode: "RBT-002",
//     robotName: "NanoRacer Pro",
//     category: "RACING",
//     weightClass: "Lightweight (<3kg)",
//     controlType: "AUTONOMOUS",
//     description: "Ultra-fast autonomous racing robot with advanced pathfinding algorithms and precision motor control for high-speed track competition.",
//     status: "ACTIVE",
//     teamId: "team-001",
//     createdAt: "2024-02-10T09:00:00Z",
//     updatedAt: "2024-03-18T11:00:00Z",
//     imageUrl: racingRobot,
//   },
//   {
//     id: "3",
//     robotCode: "RBT-003",
//     robotName: "LineBot Alpha",
//     category: "LINE_FOLLOWER",
//     weightClass: "Miniweight (<1kg)",
//     controlType: "AUTONOMOUS",
//     description: "Precision line-following robot with IR sensor array and PID control system. Optimized for tight curves and high-speed straight runs.",
//     status: "MAINTENANCE",
//     teamId: "team-001",
//     createdAt: "2024-03-01T08:00:00Z",
//     updatedAt: "2024-03-25T16:00:00Z",
//     imageUrl: lineRobot,
//   },
// ];
// export const THEME = {
//   bg: "#3a3a3a",
//   card: "#1a1a1a",
//   cardSecondary: "#2a2a2a",
//   border: "rgba(255,255,255,0.05)",
//   text: "#ffffff",
//   textSecondary: "#9ca3af",
//   muted: "#6b7280",
//   primary: "#fa4715",
// };
// export const categoryColors: Record<RobotCategory, string> = {
//   COMBAT: "#ef4444",
//   RACING: "#f97316",
//   SOCCER: "#22c55e",
//   DRONE: "#3b82f6",
//   LINE_FOLLOWER: "#a855f7",
//   CUSTOM: "#6b7280",
// };

// export const categoryIcons: Record<RobotCategory, string> = {
//   COMBAT: "",
//   RACING: "",
//   SOCCER: "",
//   DRONE: "",
//   LINE_FOLLOWER: "",
//   CUSTOM: "",
// };

// export const statusConfig: Record<RobotStatus, { color: string; bg: string; label: string }> = {
//   ACTIVE: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Active" },
//   INACTIVE: { color: THEME.muted, bg: "rgba(107,114,128,0.12)", label: "Inactive" },
//   MAINTENANCE: { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "Maintenance" },
// };

// export const controlTypeLabel: Record<ControlType, string> = {
//   REMOTE: "Remote Controlled",
//   AUTONOMOUS: "Autonomous",
//   SEMI_AUTONOMOUS: "Semi-Autonomous",
// };