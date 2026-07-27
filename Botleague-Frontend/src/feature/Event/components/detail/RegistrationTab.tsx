import { useMemo, useState } from "react";
import type { EventSportResponse, EventRegistrationResponse } from "../../api/event.api";
import type { TeamMember } from "../../hook/useEvent";
import useRobots from "../../../Robots/hooks/useRobots";
import type { Robot } from "../../../Robots/types/types";
import type { EligibilityResponse } from "../../../Eligibility/api/eligibility.api";

// Age groups that mean "open to all" — no category restriction
const OPEN_AGE_GROUPS = new Set(["OPEN", "ALL", "ALL_AGES", "UNRESTRICTED", ""]);

// Mirrors backend ROBOT_SPORT_TO_EVENT_SPORTS
const ROBOT_TO_EVENT_SPORT: Record<string, string[]> = {
  ROBOWAR_1_5KG: ["ROBO_WAR", "ROBO_WAR_OPEN"],
  ROBOWAR_8KG: ["ROBO_WAR", "ROBO_WAR_OPEN"],
  ROBOWAR_15KG: ["ROBO_WAR", "ROBO_WAR_OPEN"],
  ROBOWAR_30KG: ["ROBO_WAR", "ROBO_WAR_OPEN"],
  ROBOWAR_60KG: ["ROBO_WAR", "ROBO_WAR_OPEN"],
  ROBO_SOCCER: ["ROBO_SOCCER", "ROBO_SOCCER_OPEN"],
  PLUG_N_PLAY_SOCCER: ["PLUG_N_PLAY_RACE_SOCCER"],
  ROBO_SUMO: ["ROBO_SUMO"],
  LINE_FOLLOWER: ["LINE_FOLLOWER"],
  LINE_FOLLOWER_AUTO: ["LINE_FOLLOWER", "LINE_FOLLOWER_AUTO"],
  MANUAL_TASK: ["MANUAL_TASK"],
  THEME_BASED_TASKING: ["THEME_BASED_TASKING", "THEME_BASED_TASKING_OPEN"],
  DRONE_RACING: ["DRONE_RACING_FPV", "DRONE_RACING_SOCCER"],
  DRONE_SOCCER: ["DRONE_RACING_SOCCER"],
  RC_RACING: ["RC_ROBO_RACING", "RC_RACING_NITRO"],
  AEROMODELLING: ["AEROMODELLING"],
  PROJECT_BASED: ["PROJECT_BASED"],
};

const normWc = (wc?: string | null) => (wc ?? "").toUpperCase().replace(/\./g, "_");

const REG_ROLES = [
  { value: "DRIVER", label: "Driver" },
  { value: "SECONDARY_DRIVER", label: "Secondary Driver" },
  { value: "BUILD_HEAD", label: "Build Head" },
];

function toLabel(raw?: string | null): string {
  if (!raw) return "—";
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface RegistrationTabProps {
  sport: EventSportResponse;
  teamId: string;
  teamCode: string;
  isCaptain: boolean;
  isLoggedIn: boolean;
  existingRegs: EventRegistrationResponse[];
  busyReg: boolean;
  regError: string | null;
  eligibility: EligibilityResponse | null;
  teamMembers: TeamMember[];
  onRegister: (botId: string, robotName: string, lineup: { membershipId: string; role: string }[]) => Promise<void>;
  onCancel: (regId: string) => void;
  onManageLineup: (registrationId: string) => void;
  onDismissError: () => void;
  onRequireLogin: () => void;
}

export default function RegistrationTab({
  sport,
  teamId,
  teamCode,
  isCaptain,
  isLoggedIn,
  existingRegs,
  busyReg,
  regError,
  eligibility,
  teamMembers,
  onRegister,
  onCancel,
  onManageLineup,
  onDismissError,
  onRequireLogin,
}: RegistrationTabProps) {
  const { robots, loading: robotsLoading } = useRobots(isLoggedIn ? teamCode : undefined);

  const [selectedRobotId, setSelectedRobotId] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingLineup, setPendingLineup] = useState<{ membershipId: string; role: string }[]>([]);
  const [regMember, setRegMember] = useState("");
  const [regRole, setRegRole] = useState("DRIVER");

  const registeredBotIds = useMemo(
    () => new Set(existingRegs.map((r) => r.robotId ?? r.botId).filter(Boolean) as string[]),
    [existingRegs]
  );

  const eligibleRobots = useMemo(
    () =>
      robots.filter((robot: Robot) => {
        if (robot.status !== "ACTIVE") return false;
        if (sport.weightLimitKg != null && robot.weightKg != null && robot.weightKg > sport.weightLimitKg) return false;
        if (sport.maxLengthCm != null && robot.lengthCm != null && robot.lengthCm > sport.maxLengthCm) return false;
        if (sport.maxWidthCm != null && robot.widthCm != null && robot.widthCm > sport.maxWidthCm) return false;
        if (sport.maxHeightCm != null && robot.heightCm != null && robot.heightCm > sport.maxHeightCm) return false;
        if (sport.ageGroup && robot.eligibleCategories?.length && !robot.eligibleCategories.includes(sport.ageGroup as Robot["eligibleCategories"][number])) return false;
        if (robot.sport && sport.sport) {
          const robotSportKey = (robot.sport as string).toUpperCase();
          const allowed = ROBOT_TO_EVENT_SPORT[robotSportKey];
          if (allowed && !allowed.includes(sport.sport.toUpperCase())) return false;
        }
        if (robot.weightClass && sport.weightClass) {
          if (normWc(robot.weightClass) !== normWc(sport.weightClass)) return false;
        }
        const sportControl = (sport.controlType ?? "").toUpperCase();
        if (sportControl && sportControl !== "ANY" && robot.controlMode) {
          if (robot.controlMode.toUpperCase() !== sportControl) return false;
        }
        return true;
      }),
    [robots, sport]
  );
  const availableRobots = eligibleRobots.filter((r) => !registeredBotIds.has(r.id));
  const selectedRobot = availableRobots.find((r) => r.id === selectedRobotId) ?? null;

  const isRegOpen = sport.status?.toUpperCase() === "REGISTRATION_OPEN";
  const spotsLeft = (sport.maxTeams ?? 0) - (sport.registeredTeamsCount ?? 0);
  const isFull = sport.maxTeams != null && spotsLeft <= 0;

  // The captain's OWN eligibility no longer gates registration/lineup access —
  // registering a robot and managing the lineup are team-administrative
  // actions. It only matters if/when the captain tries to add THEMSELVES as
  // a lineup member, which the backend checks per-person on that specific
  // action (see the informational notes below, and SportRegistrationLineupService.addMember()).
  const eligBlocked = eligibility != null && !eligibility.canRegister;
  const sportAgeGroup = (sport.ageGroup ?? "").toUpperCase();
  const categoryMismatch =
    !OPEN_AGE_GROUPS.has(sportAgeGroup) &&
    eligibility?.category != null &&
    eligibility.category.toUpperCase() !== sportAgeGroup;

  const canAdd = isCaptain && isRegOpen && !isFull && !!teamId;

  const assignedMemberIds = new Set(pendingLineup.map((e) => e.membershipId));
  const takenRoles = new Set(pendingLineup.map((e) => e.role));

  const resetForm = () => {
    setSelectedRobotId("");
    setStep(1);
    setPendingLineup([]);
    setRegMember("");
    setRegRole("DRIVER");
  };

  const addToPending = () => {
    if (!regMember || takenRoles.has(regRole) || assignedMemberIds.has(regMember)) return;
    setPendingLineup((prev) => [...prev, { membershipId: regMember, role: regRole }]);
    setRegMember("");
    const nextRole = REG_ROLES.find((r) => !takenRoles.has(r.value) && r.value !== regRole);
    if (nextRole) setRegRole(nextRole.value);
  };

  const removeFromPending = (membershipId: string) => {
    setPendingLineup((prev) => prev.filter((e) => e.membershipId !== membershipId));
  };

  const handleConfirmRegistration = async () => {
    if (!selectedRobot) return;
    await onRegister(selectedRobot.id, selectedRobot.robotName, pendingLineup);
    resetForm();
  };

  if (!isLoggedIn) {
    return (
      <div className="register-page">
        <div className="reg-banner info">Log in to register your team and robots for this sport.</div>
        <button type="button" className="add-box" onClick={onRequireLogin} style={{ maxWidth: 260 }}>
          Log In to Register
        </button>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-wrapper">
        {!isCaptain && teamId && (
          <div className="reg-banner info">👁 You're a Team Member. Only the Captain can register or manage operators.</div>
        )}

        {!teamId && (
          <div className="reg-banner warning">⚠️ Join or create a team to register for this event.</div>
        )}

        {eligBlocked && (
          <div className="reg-banner info">
            ℹ️ {eligibility?.blockReason ?? "Your account isn't currently eligible to compete."} You can still
            register robots and manage the lineup — this only means you personally can't be added as a lineup
            member.
            {eligibility?.requiresGuardian && !eligibility?.hasGuardian && (
              <div style={{ marginTop: 6 }}>👤 To add yourself to a lineup you'll need a parent/guardian consent form on file. Complete it in Profile → Settings.</div>
            )}
          </div>
        )}

        {!eligBlocked && categoryMismatch && eligibility && (
          <div className="reg-banner info">
            ℹ️ This sport is open to {toLabel(sport.ageGroup)} participants. Your category is{" "}
            {eligibility.categoryLabel ?? toLabel(eligibility.category)}
            {eligibility.ageRange ? ` (age ${eligibility.ageRange})` : ""}, so you personally can't be added as a
            lineup member — but you can still register robots and add other eligible teammates.
          </div>
        )}

        {teamId && !isRegOpen && <div className="reg-banner warning">🔒 Registration is currently closed for this sport.</div>}
        {teamId && isRegOpen && isFull && <div className="reg-banner error">🚫 No spots available. This sport is full.</div>}

        {regError && (
          <div className="reg-banner error" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>⚠️ {regError}</span>
            <button type="button" onClick={onDismissError} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
              ✕
            </button>
          </div>
        )}

        {existingRegs.length > 0 && (
          <div className="register-head" style={{ marginBottom: 20 }}>
            <div>Your Registered Robots</div>
          </div>
        )}
        {existingRegs.map((reg) => {
          const regId = reg.registrationId ?? reg.id ?? "";
          return (
            <div className="build-card" key={regId} style={{ justifyContent: "space-between", paddingRight: 16, marginBottom: 14, height: "auto", minHeight: 56 }}>
              <span>
                {reg.robotName} {reg.lineupLocked ? "🔒 Locked" : `· Operators: ${reg.lineupSize ?? 0}`}
              </span>
              <span style={{ display: "flex", gap: 10 }}>
                <button type="button" className="lineup-remove-btn" style={{ border: "1.5px solid #fff", background: "transparent", color: "#fff" }} onClick={() => onManageLineup(regId)}>
                  {isCaptain ? "Manage Lineup →" : "View Lineup →"}
                </button>
                {isCaptain && !reg.lineupLocked && (
                  <button type="button" className="lineup-remove-btn" disabled={busyReg} onClick={() => onCancel(regId)}>
                    Cancel
                  </button>
                )}
              </span>
            </div>
          );
        })}

        {canAdd && (
          <div className="register-block">
            <div className="register-head">
              <div>Register Another Robot</div>
            </div>

            {step === 1 ? (
              <>
                {robotsLoading ? (
                  <p>Loading your robots…</p>
                ) : availableRobots.length === 0 ? (
                  <div className="reg-banner info">
                    {robots.length === 0
                      ? "⚠️ Your team has no robots yet. Add a robot from your team dashboard first."
                      : eligibleRobots.length === 0
                        ? `⚠️ None of your robots are eligible for this competition. Robots must be built for "${sport.sport?.replace(/_/g, " ")}" with matching weight class.`
                        : "✅ All eligible robots are already registered in this sport."}
                  </div>
                ) : (
                  <div className="register-row" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="gradient-select">
                      <select value={selectedRobotId} onChange={(e) => setSelectedRobotId(e.target.value)}>
                        <option value="">Select a robot…</option>
                        {availableRobots.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.robotName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {availableRobots.length > 0 && (
                  <button
                    type="button"
                    className="add-box"
                    disabled={!selectedRobot}
                    onClick={() => { setStep(2); setPendingLineup([]); setRegMember(""); setRegRole("DRIVER"); }}
                    style={{ marginTop: 20 }}
                  >
                    Next: Assign Lineup →
                  </button>
                )}
              </>
            ) : (
              <>
                <p style={{ marginBottom: 16, fontWeight: 600 }}>Robot: {selectedRobot?.robotName}</p>

                <div className="register-row" style={{ marginBottom: 16 }}>
                  <div className="white-select">
                    <select value={regMember} onChange={(e) => setRegMember(e.target.value)}>
                      <option value="">Select member…</option>
                      {teamMembers.map((m) => {
                        const added = assignedMemberIds.has(m.membershipId);
                        const inactive = m.status !== "ACTIVE";
                        return (
                          <option key={m.membershipId} value={m.membershipId} disabled={added || inactive}>
                            {m.userName}{added ? " (Added)" : inactive ? " (Inactive)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="white-select">
                    <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                      {REG_ROLES.map((r) => (
                        <option key={r.value} value={r.value} disabled={takenRoles.has(r.value)}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="add-box" disabled={!regMember || takenRoles.has(regRole)} onClick={addToPending}>
                    <span className="plus-circle">+</span>
                    <span>Add</span>
                  </button>
                </div>

                {pendingLineup.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontWeight: 600, marginBottom: 10 }}>Lineup ({pendingLineup.length}/3)</p>
                    {pendingLineup.map((entry) => {
                      const member = teamMembers.find((m) => m.membershipId === entry.membershipId);
                      const roleLabel = REG_ROLES.find((r) => r.value === entry.role)?.label ?? entry.role;
                      return (
                        <div key={entry.membershipId} className="build-card" style={{ justifyContent: "space-between", paddingRight: 16, marginBottom: 10, height: "auto", minHeight: 48 }}>
                          <span>{member?.userName ?? "Member"} — {roleLabel}</span>
                          <button type="button" className="lineup-remove-btn" onClick={() => removeFromPending(entry.membershipId)}>
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", gap: 16 }}>
                  <button type="button" className="add-box" style={{ maxWidth: 140 }} onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="add-box"
                    style={{ background: "linear-gradient(180deg, #117CFF 70%, #7D63FF 100%)", color: "#fff", border: "none" }}
                    disabled={busyReg || pendingLineup.length === 0}
                    onClick={handleConfirmRegistration}
                  >
                    {busyReg ? "Registering…" : pendingLineup.length === 0 ? "Add at least one lineup member" : "⚡ Complete Registration"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
