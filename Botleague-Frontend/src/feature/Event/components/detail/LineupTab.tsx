import { useEffect, useMemo, useState } from "react";
import { Lock, AlertTriangle, CheckCircle2, Check, LogIn, Info } from "lucide-react";
import type { EventSportResponse, EventRegistrationResponse, TeamLineUpResponse } from "../../api/event.api";
import type { TeamMember } from "../../hook/useEvent";
import { fitsAgeGroup } from "../../../../shared/utils/ageCategory";
import { ageGroupLabel } from "../../../../shared/utils/ageGroup";

const ACCENT = "#0162D1";
const ACCENT2 = "#8C6CFF";
const SUCCESS = "#22c55e";
const WARNING = "#f59e0b";

const ROLE_LABEL: Record<string, string> = {
  DRIVER: "Driver",
  SECONDARY_DRIVER: "Secondary Driver",
  BUILD_HEAD: "Build Head",
};

interface LineupTabProps {
  sport: EventSportResponse;
  existingRegs: EventRegistrationResponse[];
  activeRegId: string;
  setActiveRegId: (id: string) => void;
  isCaptain: boolean;
  isLoggedIn: boolean;
  teamMembers: TeamMember[];
  lineupsMap: Record<string, TeamLineUpResponse[]>;
  lineupLoading: boolean;
  lineupError: string | null;
  /** True while a registration cancel is in flight. */
  busy: boolean;
  onCancelRegistration: (regId: string) => void;
  onFetch: (regId: string) => void;
  onAdd: (membershipId: string, role: string) => void;
  onRemove: (lineupId: string) => void;
  onRequireLogin: () => void;
}

export default function LineupTab({
  sport,
  existingRegs,
  activeRegId,
  setActiveRegId,
  isCaptain,
  isLoggedIn,
  teamMembers,
  lineupsMap,
  lineupLoading,
  lineupError,
  busy,
  onCancelRegistration,
  onFetch,
  onAdd,
  onRemove,
  onRequireLogin,
}: LineupTabProps) {
  const [selectedMember, setSelectedMember] = useState("");

  // Hide members who can't be in this techsport's age group — otherwise the
  // add fails on submit with an "age mismatch".
  const eligibleMembers = useMemo(
    () => teamMembers.filter((m) => fitsAgeGroup(m.dateOfBirth, sport.ageGroup)),
    [teamMembers, sport.ageGroup]
  );
  const hiddenForAge = teamMembers.length - eligibleMembers.length;
  const [lineupRole, setLineupRole] = useState("DRIVER");

  // Fetch the active robot's lineup AND every sibling robot's — the member
  // picker needs them all to hide anyone already in another robot's lineup
  // for this techsport. onFetch de-dupes, so this is cheap after the first pass.
  useEffect(() => {
    if (activeRegId) onFetch(activeRegId);
    existingRegs.forEach((r) => {
      const id = r.registrationId ?? r.id;
      if (id && id !== activeRegId) onFetch(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegId, existingRegs.length]);

  if (!isLoggedIn) {
    return (
      <div className="lineup-page">
        <div className="reg-banner info"><LogIn size={16} /><span>Log in to view and manage your team's lineup.</span></div>
        <button type="button" className="add-box" onClick={onRequireLogin} style={{ maxWidth: 260 }}>
          Log In
        </button>
      </div>
    );
  }

  if (existingRegs.length === 0) {
    return (
      <div className="lineup-page">
        <p style={{ color: "#666" }}>Register a robot in this sport first to manage its lineup.</p>
      </div>
    );
  }

  const activeReg = existingRegs.find((r) => (r.registrationId ?? r.id) === activeRegId);
  const currentLineup = lineupsMap[activeRegId] ?? [];

  const memberKey = (e: TeamLineUpResponse) => e.teamMembershipId ?? "";
  const inCurrentLineup = new Set(currentLineup.map(memberKey));

  const minSize = sport.minTeamSize ?? 0;
  const maxSize = sport.maxTeamSize ?? Infinity;
  const atMax = currentLineup.length >= maxSize;
  const belowMin = minSize > 0 && currentLineup.length < minSize;

  // Only a Driver is required, and only the Driver slot is one-per-robot.
  // Secondary Driver / Build Head are optional and may repeat.
  const driverTaken = currentLineup.some((m) => m.isActive && m.lineupRole === "DRIVER");
  const roleDisabled = (v: string) => v === "DRIVER" && driverTaken;

  // Members already in ANOTHER robot's lineup for this techsport — a person can
  // be in only one robot per techsport (a different weight class is its own
  // techsport and is fine). They are hidden from the picker entirely rather
  // than shown greyed out: the backend rejects the assignment anyway, so
  // offering the name only to fail on click is a dead end. A count below says
  // how many were hidden, so nobody wonders where a teammate went.
  const assignedElsewhere = new Set(
    Object.entries(lineupsMap)
      .filter(([regId]) => regId !== activeRegId)
      .flatMap(([, list]) => list.filter((e) => e.isActive).map(memberKey))
  );

  // Everyone the captain can actually pick right now.
  const selectableMembers = eligibleMembers.filter(
    (m) => inCurrentLineup.has(m.membershipId) || !assignedElsewhere.has(m.membershipId)
  );
  const hiddenForOtherRobot = eligibleMembers.length - selectableMembers.length;

  // A sibling robot's lineup can finish loading after someone was already
  // picked here — drop a selection that has just become unavailable rather
  // than letting Assign submit it and fail server-side.
  const selectionStillValid =
    !selectedMember || selectableMembers.some((m) => m.membershipId === selectedMember);

  return (
    <div className="lineup-page">
      {existingRegs.length > 1 && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 30 }}>
          {existingRegs.map((reg) => {
            const regId = reg.registrationId ?? reg.id ?? "";
            const active = regId === activeRegId;
            return (
              <button
                key={regId}
                type="button"
                onClick={() => setActiveRegId(regId)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: `2px solid ${ACCENT}`,
                  background: active ? `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` : "#fff",
                  color: active ? "#fff" : ACCENT,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {reg.robotName} {reg.lineupLocked && <Lock size={12} style={{ verticalAlign: "middle", marginLeft: 4 }} />}
              </button>
            );
          })}
        </div>
      )}

      {lineupError && <div className="reg-banner error"><AlertTriangle size={16} /><span>{lineupError}</span></div>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
        <h2 className="lineup-head">
          {activeReg?.robotName}{" "}
          {activeReg?.lineupLocked && (
            <span style={{ fontSize: 13, opacity: 0.7, display: "inline-flex", alignItems: "center", gap: 4 }}>
              · <Lock size={13} /> Lineup locked
            </span>
          )}
        </h2>
        {/* Cancelling a registration lives here rather than on the Register
            tab: this is the one place a specific registered robot is already
            the subject of the screen. */}
        {isCaptain && activeReg && !activeReg.lineupLocked && (
          <button
            type="button"
            className="lineup-remove-btn"
            disabled={busy}
            onClick={() => onCancelRegistration(activeRegId)}
          >
            Cancel registration
          </button>
        )}
      </div>

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
          {!activeReg?.lineupLocked && !driverTaken && (
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
              {isCaptain && !activeReg?.lineupLocked ? (
                <button type="button" className="lineup-remove-btn" onClick={() => onRemove(entry.lineupId)}>
                  Remove
                </button>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      )}

      {isCaptain && activeReg && !activeReg.lineupLocked && (
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
                  return (
                    <button
                      key={m.membershipId}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedMember(m.membershipId)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: `1.5px solid ${selectedMember === m.membershipId ? ACCENT : "#ccc"}`,
                        background: selectedMember === m.membershipId ? "rgba(1,98,209,.08)" : "#fff",
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

              {selectedMember && selectionStillValid && (
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <select className="lineup-select" style={{ maxWidth: 220 }} value={lineupRole} onChange={(e) => setLineupRole(e.target.value)}>
                    {Object.entries(ROLE_LABEL).map(([value, label]) => (
                      <option key={value} value={value} disabled={roleDisabled(value)}>
                        {label}{value === "DRIVER" ? "" : " (optional)"}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="add-box"
                    style={{ maxWidth: 160 }}
                    disabled={roleDisabled(lineupRole)}
                    onClick={() => { onAdd(selectedMember, lineupRole); setSelectedMember(""); }}
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
  );
}
