import { useMemo, useState } from "react";
import { Eye, AlertTriangle, Info, User, Lock, Ban, X, CheckCircle2, Zap, LogIn } from "lucide-react";
import type { EventSportResponse, EventRegistrationResponse } from "../../api/event.api";
import type { TeamMember } from "../../hook/useEvent";
import useRobots from "../../../Robots/hooks/useRobots";
import type { Robot } from "../../../Robots/types/types";
import type { EligibilityResponse } from "../../../Eligibility/api/eligibility.api";
import { ageGroupLabel } from "../../../../shared/utils/ageGroup";
import { fitsAgeGroup } from "../../../../shared/utils/ageCategory";
import { weightClassToKg } from "../../../Robots/constants/weightClasses";
import { constraintsFor } from "../../utils/specPolicy";

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
  ROBO_SUMO: ["ROBO_SUMO"],
  LINE_FOLLOWER: ["LINE_FOLLOWER"],
  LINE_FOLLOWER_AUTO: ["LINE_FOLLOWER", "LINE_FOLLOWER_AUTO"],
  DRONE_RACING: ["DRONE_RACING_FPV", "DRONE_RACING_SOCCER"],
  DRONE_SOCCER: ["DRONE_RACING_SOCCER"],
  RC_RACING: ["RC_ROBO_RACING", "RC_RACING_NITRO"],
};

const normWc = (wc?: string | null) => (wc ?? "").toUpperCase().replace(/\./g, "_");

// The event sport is stored as its catalog display name ("Robo War"), a robot
// as a legacy key ("ROBOWAR_15KG"), and ROBOT_TO_EVENT_SPORT's values as
// canonical tokens ("ROBO_WAR"). Fold all three to one shape before matching —
// without this, `"Robo War".toUpperCase()` ("ROBO WAR") never equals the
// "ROBO_WAR" token and every robot fails the sport-compatibility check.
const normSport = (s?: string | null) =>
  (s ?? "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const REG_ROLES = [
  { value: "DRIVER", label: "Driver" },
  { value: "SECONDARY_DRIVER", label: "Secondary Driver" },
  { value: "BUILD_HEAD", label: "Build Head" },
];

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

  const specs = useMemo(() => constraintsFor(sport.ageGroup, sport.sport), [sport.ageGroup, sport.sport]);

  const eligibleRobots = useMemo(
    () =>
      robots.filter((robot: Robot) => {
        if (robot.status !== "ACTIVE") return false;
        // Only the spec(s) this (league, sport) actually enforces — e.g. RoboWar
        // is weight-only, so its dimension limits never gate a robot. Within an
        // applicable spec, a value the robot didn't record never excludes it —
        // only a present value over the limit does.
        if (specs.weight) {
          const weightCeiling = sport.weightLimitKg ?? weightClassToKg(sport.weightClass);
          if (weightCeiling != null && robot.weightKg != null && robot.weightKg > weightCeiling) return false;
        }
        if (specs.dimension) {
          if (sport.maxLengthCm != null && robot.lengthCm != null && robot.lengthCm > sport.maxLengthCm) return false;
          if (sport.maxWidthCm != null && robot.widthCm != null && robot.widthCm > sport.maxWidthCm) return false;
          if (sport.maxHeightCm != null && robot.heightCm != null && robot.heightCm > sport.maxHeightCm) return false;
        }
        if (sport.ageGroup && robot.eligibleCategories?.length && !robot.eligibleCategories.includes(sport.ageGroup as Robot["eligibleCategories"][number])) return false;
        if (robot.sport && sport.sport) {
          const allowed = ROBOT_TO_EVENT_SPORT[normSport(robot.sport)];
          if (allowed && !allowed.some((s) => normSport(s) === normSport(sport.sport))) return false;
        }
        // Weight class only gates sports whose spec policy actually cares about
        // weight (see specPolicy.ts). RC Racing Car etc. are scale-gated —
        // their event-sport row still carries a weightClass value (AddSportModal
        // sends the literal "Open" for every scale-gated sport, since the DB
        // column has no null-weight-class concept), so comparing it unconditionally
        // rejected every robot whose own weightClass wasn't also exactly "Open".
        if (specs.weight && robot.weightClass && sport.weightClass) {
          if (normWc(robot.weightClass) !== normWc(sport.weightClass)) return false;
        }
        if (specs.scale) {
          const requiredScale = sport.extraRules?.scale;
          const robotScale = robot.attributes?.scaleClass;
          if (requiredScale && robotScale && normWc(robotScale) !== normWc(requiredScale)) return false;
        }
        const sportControl = (sport.controlType ?? "").toUpperCase();
        if (sportControl && sportControl !== "ANY" && robot.controlMode) {
          if (robot.controlMode.toUpperCase() !== sportControl) return false;
        }
        return true;
      }),
    [robots, sport, specs]
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

  // Only a Driver is required, and only the Driver slot is unique — Secondary
  // Driver / Build Head are optional and can each be held by more than one
  // person (backend enforces the same).
  const driverTaken = pendingLineup.some((e) => e.role === "DRIVER");
  const lineupComplete = driverTaken;
  const roleDisabled = (v: string) => v === "DRIVER" && driverTaken;

  // Only members who can actually be in this techsport's age group are
  // selectable — otherwise the pick fails on submit with "age mismatch".
  const eligibleMembers = useMemo(
    () => teamMembers.filter((m) => fitsAgeGroup(m.dateOfBirth, sport.ageGroup)),
    [teamMembers, sport.ageGroup]
  );
  const hiddenForAge = teamMembers.length - eligibleMembers.length;

  const resetForm = () => {
    setSelectedRobotId("");
    setStep(1);
    setPendingLineup([]);
    setRegMember("");
    setRegRole("DRIVER");
  };

  const addToPending = () => {
    if (!regMember || roleDisabled(regRole) || assignedMemberIds.has(regMember)) return;
    setPendingLineup((prev) => [...prev, { membershipId: regMember, role: regRole }]);
    setRegMember("");
    // After the Driver is set, default the next pick to Secondary Driver.
    if (regRole === "DRIVER") setRegRole("SECONDARY_DRIVER");
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
        <div className="reg-banner info"><LogIn size={16} /><span>Log in to register your team and robots for this sport.</span></div>
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
          <div className="reg-banner info"><Eye size={16} /><span>You're a Team Member. Only the Captain can register or manage operators.</span></div>
        )}

        {!teamId && (
          <div className="reg-banner warning"><AlertTriangle size={16} /><span>Join or create a team to register for this event.</span></div>
        )}

        {eligBlocked && (
          <div className="reg-banner info">
            <Info size={16} />
            <div>
              <span>
                {eligibility?.blockReason ?? "Your account isn't currently eligible to compete."} You can still
                register robots and manage the lineup — this only means you personally can't be added as a lineup
                member.
              </span>
              {eligibility?.requiresGuardian && !eligibility?.hasGuardian && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <User size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>To add yourself to a lineup you'll need a parent/guardian consent form on file. Complete it in Profile → Settings.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!eligBlocked && categoryMismatch && eligibility && (
          <div className="reg-banner info">
            <Info size={16} />
            <span>
              This sport is open to {ageGroupLabel(sport.ageGroup)} participants. Your category is{" "}
              {eligibility.categoryLabel ?? ageGroupLabel(eligibility.category)}
              {eligibility.ageRange ? ` (age ${eligibility.ageRange})` : ""}, so you personally can't be added as a
              lineup member — but you can still register robots and add other eligible teammates.
            </span>
          </div>
        )}

        {teamId && !isRegOpen && <div className="reg-banner warning"><Lock size={16} /><span>Registration is currently closed for this sport.</span></div>}
        {teamId && isRegOpen && isFull && <div className="reg-banner error"><Ban size={16} /><span>No spots available. This sport is full.</span></div>}

        {regError && (
          <div className="reg-banner error" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              {regError}
            </span>
            <button type="button" onClick={onDismissError} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        {existingRegs.length > 0 && (
          <div className="register-head" style={{ marginBottom: 20 }}>
            <h2>Your Registered Robots</h2>
          </div>
        )}
        {existingRegs.map((reg) => {
          const regId = reg.registrationId ?? reg.id ?? "";
          return (
            <div className="build-card" key={regId} style={{ justifyContent: "space-between", paddingRight: 16, marginBottom: 14, height: "auto", minHeight: 56 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {reg.robotName}
                <span style={{ color: "#FFF", fontWeight: 500 }}>· Lineup: {reg.lineupSize ?? 0}</span>
                {reg.lineupLocked && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Lock size={12} /> Locked</span>
                )}
              </span>
              <span style={{ display: "flex", gap: 10 }}>
                <button type="button" className="lineup-manage-btn" onClick={() => onManageLineup(regId)}>
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
              <h2>Register Another Robot</h2>
            </div>

            {step === 1 ? (
              <>
                {robotsLoading ? (
                  <p>Loading your robots…</p>
                ) : availableRobots.length === 0 ? (
                  <div className="reg-banner info">
                    {robots.length === 0 ? (
                      <><AlertTriangle size={16} /><span>Your team has no robots yet. Add a robot from your team dashboard first.</span></>
                    ) : eligibleRobots.length === 0 ? (
                      <><AlertTriangle size={16} /><span>None of your robots are eligible for this competition. Robots must be built for "{sport.sport?.replace(/_/g, " ")}" with matching {specs.scale ? "scale" : specs.weight && specs.dimension ? "weight class and dimensions" : specs.weight ? "weight class" : specs.dimension ? "dimensions" : "specs"}.</span></>
                    ) : (
                      <><CheckCircle2 size={16} /><span>All eligible robots are already registered in this sport.</span></>
                    )}
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
                      {eligibleMembers.map((m) => {
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
                        <option key={r.value} value={r.value} disabled={roleDisabled(r.value)}>
                          {r.label}{r.value === "DRIVER" ? "" : " (optional)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="add-box" disabled={!regMember || roleDisabled(regRole)} onClick={addToPending}>
                    <span className="plus-circle">+</span>
                    <span>Add</span>
                  </button>
                </div>

                {hiddenForAge > 0 && (
                  <p style={{ fontSize: 12.5, color: "#6b7280", marginTop: -6, marginBottom: 14 }}>
                    <Info size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                    {hiddenForAge} team member{hiddenForAge > 1 ? "s are" : " is"} hidden — not in the {ageGroupLabel(sport.ageGroup)} age group for this techsport.
                  </p>
                )}

                {pendingLineup.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontWeight: 600, marginBottom: 10 }}>
                      Lineup ({pendingLineup.length})
                      {!lineupComplete && (
                        <span style={{ fontWeight: 500, color: "#b45309", marginLeft: 8 }}>
                          — a Driver is required
                        </span>
                      )}
                    </p>
                    {pendingLineup.map((entry) => {
                      const member = teamMembers.find((m) => m.membershipId === entry.membershipId);
                      const roleLabel = REG_ROLES.find((r) => r.value === entry.role)?.label ?? entry.role;
                      return (
                        <div key={entry.membershipId} className="build-card" style={{ justifyContent: "space-between", paddingRight: 16, marginBottom: 10, height: "auto", minHeight: 48 }}>
                          <span>{member?.userName ?? "Member"} — {roleLabel}</span>
                          <button type="button" className="lineup-remove-btn" onClick={() => removeFromPending(entry.membershipId)} aria-label="Remove">
                            <X size={14} />
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
                    disabled={busyReg || !lineupComplete}
                    onClick={handleConfirmRegistration}
                  >
                    {busyReg
                      ? "Registering…"
                      : !lineupComplete
                        ? "Assign a Driver to register"
                        : <><Zap size={14} /> Complete Registration</>}
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
