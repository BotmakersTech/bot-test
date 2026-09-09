import { useEffect, useMemo, useState } from "react";
import {
  Eye, AlertTriangle, Info, User, Lock, Ban, X, CheckCircle2, Zap, LogIn, Check, ChevronDown, ChevronUp,
} from "lucide-react";
import type { EventSportResponse, EventRegistrationResponse, TeamLineUpResponse } from "../../api/event.api";
import type { TeamMember } from "../../hook/useEvent";
import useRobots from "../../../Robots/hooks/useRobots";
import type { Robot } from "../../../Robots/types/types";
import type { EligibilityResponse } from "../../../Eligibility/api/eligibility.api";
import { ageGroupLabel } from "../../../../shared/utils/ageGroup";
import { fitsAgeGroup } from "../../../../shared/utils/ageCategory";
import { weightClassToKg } from "../../../Robots/constants/weightClasses";
import { constraintsFor, sportKey } from "../../utils/specPolicy";

// Age groups that mean "open to all" — no category restriction
const OPEN_AGE_GROUPS = new Set(["OPEN", "ALL", "ALL_AGES", "UNRESTRICTED", ""]);

const ACCENT = "#0162D1";
const ACCENT2 = "#8C6CFF";
const SUCCESS = "#22c55e";
const WARNING = "#f59e0b";

const ROLE_LABEL: Record<string, string> = {
  DRIVER: "Driver",
  SECONDARY_DRIVER: "Secondary Driver",
  BUILD_HEAD: "Build Head",
};

const normWc = (wc?: string | null) => (wc ?? "").toUpperCase().replace(/\./g, "_");

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
  /** Lineups of every robot already registered in this techsport, keyed by
   *  registration id — used both to keep taken people out of the NEW-robot
   *  member picker, and to render each registered robot's own lineup panel. */
  lineupsMap?: Record<string, TeamLineUpResponse[]>;
  lineupLoading?: boolean;
  lineupError?: string | null;
  onRegister: (botId: string, robotName: string, lineup: { membershipId: string; role: string }[]) => Promise<void>;
  onDismissError: () => void;
  onRequireLogin: () => void;
  // --- lineup management, now inline under each registered robot ---
  onFetchLineup?: (regId: string) => void;
  onAddLineupMember?: (regId: string, membershipId: string, role: string) => void;
  onRemoveLineupMember?: (regId: string, lineupId: string) => void;
  onCancelRegistration?: (regId: string) => void;
}

export default function RegistrationTab({
  sport,
  teamId,
  teamCode,
  isCaptain,
  isLoggedIn,
  existingRegs = [],
  busyReg,
  regError,
  eligibility,
  teamMembers = [],
  lineupsMap = {},
  lineupLoading = false,
  lineupError = null,
  onRegister,
  onDismissError,
  onRequireLogin,
  onFetchLineup,
  onAddLineupMember,
  onRemoveLineupMember,
  onCancelRegistration,
}: RegistrationTabProps) {
  const { robots, loading: robotsLoading } = useRobots(isLoggedIn ? teamCode : undefined);

  const [selectedRobotId, setSelectedRobotId] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [pendingLineup, setPendingLineup] = useState<{ membershipId: string; role: string }[]>([]);
  const [regMember, setRegMember] = useState("");
  const [regRole, setRegRole] = useState("DRIVER");

  // Which registered robot's lineup panel is expanded (accordion — one at a time).
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);
  const [lineupSelectedMember, setLineupSelectedMember] = useState("");
  const [lineupSelectedRole, setLineupSelectedRole] = useState("DRIVER");

  const safeExistingRegs = existingRegs ?? [];
  const safeTeamMembers = teamMembers ?? [];
  const safeLineupsMap = lineupsMap ?? {};

  const registeredBotIds = useMemo(
    () => new Set(safeExistingRegs.map((r) => r.robotId ?? r.botId).filter(Boolean) as string[]),
    [safeExistingRegs]
  );

  const specs = useMemo(() => constraintsFor(sport.ageGroup, sport.sport), [sport.ageGroup, sport.sport]);

  const eligibleRobots = useMemo(
    () =>
      (robots ?? []).filter((robot: Robot) => {
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
        // A robot only belongs in a competition for the SAME real sport it was
        // built for — Robo Race and RC Racing Car are both RC vehicles but
        // gated on different specs (weight/dimension vs scale) and must never
        // be treated as interchangeable. sportKey() buckets every naming
        // variant on both sides (event's catalog name, robot's legacy key)
        // to one canonical token, so this can't drift the way a hand-
        // maintained name-to-name allowlist did (mirrors the backend's own
        // ROBOT_SPORT_TO_EVENT_SPORTS check in SportRegistrationService).
        if (robot.sport && sport.sport && sportKey(robot.sport) !== sportKey(sport.sport)) return false;
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
          // A techsport can offer more than one scale (extraRules.scale is a
          // comma-separated list, e.g. "1:10,1:12") — the robot only needs to
          // match ONE of them. Mirrors the backend's own check in
          // SportRegistrationService.registerRobot(); comparing the robot's
          // single scale against the raw CSV string (instead of splitting it
          // first) rejected every robot whenever a sport allowed more than one.
          const allowedScales = sport.extraRules?.scale;
          const robotScale = robot.attributes?.scaleClass;
          if (allowedScales && robotScale) {
            const matches = allowedScales.split(",").some((s) => normWc(s) === normWc(robotScale));
            if (!matches) return false;
          }
        }
        if (specs.diameter) {
          // Drone Soccer's only real gate. Same shape as scale above: the
          // robot's value lives in attributes, the competition's in extraRules
          // (carried there from the catalog row), and neither side having a
          // value never excludes a robot.
          const maxDiameter = parseFloat(sport.extraRules?.diameterCm ?? "");
          const robotDiameter = parseFloat(robot.attributes?.diameterCm ?? "");
          if (!Number.isNaN(maxDiameter) && !Number.isNaN(robotDiameter) && robotDiameter > maxDiameter) return false;
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
    () => safeTeamMembers.filter((m) => fitsAgeGroup(m.dateOfBirth, sport.ageGroup)),
    [safeTeamMembers, sport.ageGroup]
  );
  const hiddenForAge = safeTeamMembers.length - eligibleMembers.length;

  // A person may be in only one robot's lineup per techsport. The robot being
  // registered here has no lineup of its own yet, so EVERY member already in a
  // registered robot's lineup for this techsport is unavailable — offering them
  // only gets the pick rejected on submit.
  const assignedElsewhereForNewRobot = useMemo(
    () => new Set(
      Object.values(safeLineupsMap)
        .flat()
        .filter((e) => e.isActive)
        .map((e) => e.teamMembershipId ?? "")
    ),
    [safeLineupsMap]
  );

  const selectableMembersForNewRobot = useMemo(
    () => eligibleMembers.filter((m) => !assignedElsewhereForNewRobot.has(m.membershipId)),
    [eligibleMembers, assignedElsewhereForNewRobot]
  );
  const hiddenForOtherRobotNewReg = eligibleMembers.length - selectableMembersForNewRobot.length;

  // Fetch every registered robot's lineup up front — the "assigned in another
  // robot's lineup" check needs all of them regardless of which panel is open.
  // Guarded: if the parent hasn't wired onFetchLineup yet, skip quietly
  // instead of crashing — the rest of the tab (registration flow) still works.
  useEffect(() => {
    if (!onFetchLineup) return;
    safeExistingRegs.forEach((r) => {
      const id = r.registrationId ?? r.id;
      if (id) onFetchLineup(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeExistingRegs.length, onFetchLineup]);

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

  const toggleLineupPanel = (regId: string) => {
    setLineupSelectedMember("");
    setLineupSelectedRole("DRIVER");
    setExpandedRegId((prev) => (prev === regId ? null : regId));
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

        {/* ---- Registered robots, each with its own inline lineup panel ---- */}
        {safeExistingRegs.length > 0 && (
          <div className="register-head" style={{ marginBottom: 20 }}>
            <h2>Your Registered Robots</h2>
          </div>
        )}

        {safeExistingRegs.map((reg) => {
          const regId = reg.registrationId ?? reg.id ?? "";
          const isExpanded = expandedRegId === regId;
          const currentLineup = safeLineupsMap[regId] ?? [];

          const memberKey = (e: TeamLineUpResponse) => e.teamMembershipId ?? "";
          const inCurrentLineup = new Set(currentLineup.map(memberKey));

          const minSize = sport.minTeamSize ?? 0;
          const maxSize = sport.maxTeamSize ?? Infinity;
          const atMax = currentLineup.length >= maxSize;
          const belowMin = minSize > 0 && currentLineup.length < minSize;

          const driverTakenInLineup = currentLineup.some((m) => m.isActive && m.lineupRole === "DRIVER");
          const lineupRoleDisabled = (v: string) => v === "DRIVER" && driverTakenInLineup;

          // Members already in ANOTHER robot's lineup for this techsport — a
          // person can be in only one robot per techsport (a different weight
          // class is its own techsport and is fine). Hidden from the picker
          // entirely rather than shown greyed out: the backend rejects the
          // assignment anyway, so offering the name only to fail on click is
          // a dead end. A count below says how many were hidden.
          const assignedElsewhere = new Set(
            Object.entries(safeLineupsMap)
              .filter(([id]) => id !== regId)
              .flatMap(([, list]) => (list ?? []).filter((e) => e.isActive).map(memberKey))
          );

          const selectableMembers = eligibleMembers.filter(
            (m) => inCurrentLineup.has(m.membershipId) || !assignedElsewhere.has(m.membershipId)
          );
          const hiddenForOtherRobot = eligibleMembers.length - selectableMembers.length;

          // A sibling robot's lineup can finish loading after someone was
          // already picked here — drop a selection that's just become
          // unavailable rather than letting Assign submit and fail server-side.
          const selectionStillValid =
            !isExpanded ||
            !lineupSelectedMember ||
            selectableMembers.some((m) => m.membershipId === lineupSelectedMember);

          return (
            <div key={regId} className="build-card-wrap" style={{ marginBottom: 14 }}>
              <div className="build-card" style={{ justifyContent: "space-between", paddingRight: 16, height: "auto", minHeight: 56 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {reg.robotName}
                  <span style={{ color: "#FFF", fontWeight: 500 }}>· Lineup: {reg.lineupSize ?? 0}</span>
                  {reg.lineupLocked && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Lock size={12} /> Locked</span>
                  )}
                </span>
                <button type="button" className="lineup-manage-btn" onClick={() => toggleLineupPanel(regId)}>
                  {isCaptain ? "Manage Lineup" : "View Lineup"}
                  {isExpanded ? <ChevronUp size={14} style={{ marginLeft: 4 }} /> : <ChevronDown size={14} style={{ marginLeft: 4 }} />}
                </button>
              </div>

              {isExpanded && (
                <div className="lineup-inline-panel" style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 20, background: "#fafafa" }}>
                  {lineupError && <div className="reg-banner error"><AlertTriangle size={16} /><span>{lineupError}</span></div>}

                  {/* Cancelling a registration lives right here, next to the
                      robot whose lineup you're already looking at. */}
                  {isCaptain && !reg.lineupLocked && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                      <button
                        type="button"
                        className="lineup-remove-btn"
                        disabled={busyReg}
                        onClick={() => onCancelRegistration?.(regId)}
                      >
                        Cancel registration
                      </button>
                    </div>
                  )}

                  {(maxSize !== Infinity || minSize > 0) && (
                    <div style={{ marginBottom: 24 }}>
                      <div className="lineup-progress-track">
                        <div
                          className="lineup-progress-fill"
                          style={{
                            width: `${Math.min((currentLineup.length / (maxSize === Infinity ? currentLineup.length || 1 : maxSize)) * 100, 100)}%`,
                            background: atMax
                              ? `linear-gradient(to right, ${SUCCESS}, #22c55e)`
                              : belowMin
                                ? `linear-gradient(to right, ${WARNING}, #f59e0b)`
                                : `linear-gradient(to right, ${ACCENT}, ${ACCENT2})`,
                          }}
                        />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>
                        {currentLineup.length} / {maxSize === Infinity ? "∞" : maxSize}
                        {minSize > 0 ? ` (min ${minSize})` : ""}
                      </p>
                      {atMax && (
                        <p style={{ fontSize: 13, color: SUCCESS, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle2 size={14} /> Lineup complete — maximum players reached.
                        </p>
                      )}
                      {!atMax && belowMin && (
                        <p style={{ fontSize: 13, color: WARNING, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={14} /> Add at least {minSize - currentLineup.length} more player{minSize - currentLineup.length !== 1 ? "s" : ""} to meet the minimum.
                        </p>
                      )}
                      {!reg.lineupLocked && !driverTakenInLineup && (
                        <p style={{ fontSize: 13, color: WARNING, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertTriangle size={14} /> A Driver is required. Secondary Driver and Build Head are optional.
                        </p>
                      )}
                    </div>
                  )}

                  {lineupLoading ? (
                    <p>Loading lineup…</p>
                  ) : (
                    <div className="lineup-table">
                      {currentLineup.map((entry) => (
                        <div key={entry.lineupId} style={{ display: "contents" }}>
                          <div className="build-card">{entry.memberName}</div>
                          <div className="lineup-select" style={{ display: "flex", alignItems: "center" }}>{ROLE_LABEL[entry.lineupRole] ?? entry.lineupRole}</div>
                          {isCaptain && !reg.lineupLocked ? (
                            <button
                              type="button"
                              className="lineup-remove-btn"
                              onClick={() => onRemoveLineupMember?.(regId, entry.lineupId)}
                            >
                              Remove
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isCaptain && !reg.lineupLocked && (
                    <div style={{ marginTop: 30 }}>
                      <h3 className="lineup-head" style={{ fontSize: 20 }}>Assign Team Member</h3>

                      {atMax ? (
                        <div className="reg-banner success"><CheckCircle2 size={16} /><span>Lineup is full ({maxSize}/{maxSize} players). Remove a player to make room.</span></div>
                      ) : (
                        <>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                            {selectableMembers.map((m) => {
                              const isIn = inCurrentLineup.has(m.membershipId);
                              const isInactive = !isIn && m.status !== "ACTIVE";
                              const disabled = isIn || isInactive;
                              const isSelected = isExpanded && lineupSelectedMember === m.membershipId;
                              return (
                                <button
                                  key={m.membershipId}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => setLineupSelectedMember(m.membershipId)}
                                  style={{
                                    padding: "8px 16px",
                                    borderRadius: 10,
                                    border: `1.5px solid ${isSelected ? ACCENT : "#ccc"}`,
                                    background: isSelected ? "rgba(1,98,209,.08)" : "#fff",
                                    opacity: disabled ? 0.45 : 1,
                                    cursor: disabled ? "not-allowed" : "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                  }}
                                >
                                  {m.userName}{" "}
                                  {isIn ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Check size={12} /> In lineup</span>
                                  ) : isInactive ? "(Inactive)" : ""}
                                </button>
                              );
                            })}
                          </div>

                          {hiddenForAge > 0 && (
                            <p style={{ fontSize: 12.5, color: "#6b7280", marginTop: -8, marginBottom: 16 }}>
                              <Info size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                              {hiddenForAge} team member{hiddenForAge > 1 ? "s are" : " is"} hidden — not in the {ageGroupLabel(sport.ageGroup)} age group for this techsport.
                            </p>
                          )}

                          {hiddenForOtherRobot > 0 && (
                            <p style={{ fontSize: 12.5, color: "#6b7280", marginTop: -8, marginBottom: 16 }}>
                              <Info size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                              {hiddenForOtherRobot} team member{hiddenForOtherRobot > 1 ? "s are" : " is"} hidden — already in another robot's lineup for this techsport. A person can be in only one robot here, but is free to join a robot in another weight class.
                            </p>
                          )}

                          {selectableMembers.length === 0 && (
                            <p style={{ fontSize: 12.5, color: "#6b7280", marginTop: -8, marginBottom: 16 }}>
                              <Info size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                              No team members are available to add to this lineup.
                            </p>
                          )}

                          {lineupSelectedMember && selectionStillValid && (
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                              <select className="lineup-select" style={{ maxWidth: 220 }} value={lineupSelectedRole} onChange={(e) => setLineupSelectedRole(e.target.value)}>
                                {Object.entries(ROLE_LABEL).map(([value, label]) => (
                                  <option key={value} value={value} disabled={lineupRoleDisabled(value)}>
                                    {label}{value === "DRIVER" ? "" : " (optional)"}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="add-box"
                                style={{ maxWidth: 160 }}
                                disabled={lineupRoleDisabled(lineupSelectedRole)}
                                onClick={() => {
                                  onAddLineupMember?.(regId, lineupSelectedMember, lineupSelectedRole);
                                  setLineupSelectedMember("");
                                }}
                              >
                                <span className="plus-circle">+</span>
                                <span>Assign</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* ---- Register another robot ---- */}
        {canAdd && (
          <div className="register-section">
            <h2 className="register-section-head">Register a Robot</h2>
            <p className="register-section-sub">
              {step === 1
                ? "Step 1 of 2 — choose which robot to enter."
                : `Step 2 of 2 — assign the lineup for ${selectedRobot?.robotName ?? "this robot"}.`}
            </p>

            {step === 1 ? (
              <>
                {robotsLoading ? (
                  <p>Loading your robots…</p>
                ) : availableRobots.length === 0 ? (
                  <div className="reg-banner info">
                    {(robots ?? []).length === 0 ? (
                      <><AlertTriangle size={16} /><span>Your team has no robots yet. Add a robot from your team dashboard first.</span></>
                    ) : eligibleRobots.length === 0 ? (
                      <><AlertTriangle size={16} /><span>None of your robots are eligible for this competition. Robots must be built for "{sport.sport?.replace(/_/g, " ")}" with matching {specs.scale ? "scale" : specs.diameter ? "diameter" : specs.weight && specs.dimension ? "weight class and dimensions" : specs.weight ? "weight class" : specs.dimension ? "dimensions" : "specs"}.</span></>
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
                <p style={{
                  marginBottom: 16,
                  fontSize: 13,
                  color: driverTaken ? "#15803d" : WARNING,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  {driverTaken ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  {driverTaken
                    ? "Driver assigned — this robot is ready to register."
                    : "A Driver is required to register this robot. Secondary Driver and Build Head are optional."}
                </p>

                <div className="register-row" style={{ marginBottom: 16 }}>
                  <div className="white-select">
                    <select value={regMember} onChange={(e) => setRegMember(e.target.value)}>
                      <option value="">Select member…</option>
                      {selectableMembersForNewRobot
                        .filter((m) => !assignedMemberIds.has(m.membershipId))
                        .map((m) => {
                          const inactive = m.status !== "ACTIVE";
                          return (
                            <option key={m.membershipId} value={m.membershipId} disabled={inactive}>
                              {m.userName}{inactive ? " (Inactive)" : ""}
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
                  <p className="reg-hint">
                    <Info size={13} />
                    <span>{hiddenForAge} team member{hiddenForAge > 1 ? "s are" : " is"} hidden — not in the {ageGroupLabel(sport.ageGroup)} age group for this techsport.</span>
                  </p>
                )}

                {hiddenForOtherRobotNewReg > 0 && (
                  <p className="reg-hint">
                    <Info size={13} />
                    <span>{hiddenForOtherRobotNewReg} team member{hiddenForOtherRobotNewReg > 1 ? "s are" : " is"} hidden — already in another robot's lineup for this techsport. A person can be in only one robot here, but is free to join a robot in another weight class.</span>
                  </p>
                )}

                {selectableMembersForNewRobot.length === 0 && (
                  <p className="reg-hint">
                    <Info size={13} />
                    <span>No team members are available for this robot's lineup — everyone eligible is already in another robot for this techsport.</span>
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
                      const member = safeTeamMembers.find((m) => m.membershipId === entry.membershipId);
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
                        ? "Register"
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