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

  useEffect(() => {
    if (activeRegId) onFetch(activeRegId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegId]);

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
  const allAssigned = new Set(Object.values(lineupsMap).flatMap((l) => l.map(memberKey)));
  const inCurrentLineup = new Set(currentLineup.map(memberKey));
  const takenRoles = new Set(currentLineup.filter((m) => m.isActive).map((m) => m.lineupRole));

  const minSize = sport.minTeamSize ?? 0;
  const maxSize = sport.maxTeamSize ?? Infinity;
  const atMax = currentLineup.length >= maxSize;
  const belowMin = minSize > 0 && currentLineup.length < minSize;

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

      <h2 className="lineup-head">
        {activeReg?.robotName}{" "}
        {activeReg?.lineupLocked && (
          <span style={{ fontSize: 16, opacity: 0.7, display: "inline-flex", alignItems: "center", gap: 4 }}>
            · <Lock size={14} /> Lineup locked
          </span>
        )}
      </h2>

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
                {eligibleMembers.map((m) => {
                  const isIn = inCurrentLineup.has(m.membershipId);
                  const isOther = !isIn && allAssigned.has(m.membershipId);
                  const isInactive = !isIn && !isOther && m.status !== "ACTIVE";
                  const disabled = isIn || isOther || isInactive;
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
                      ) : isOther ? "(In other robot)" : isInactive ? "(Inactive)" : ""}
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

              {selectedMember && (
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <select className="lineup-select" style={{ maxWidth: 220 }} value={lineupRole} onChange={(e) => setLineupRole(e.target.value)}>
                    {Object.entries(ROLE_LABEL).map(([value, label]) => (
                      <option key={value} value={value} disabled={takenRoles.has(value)}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="add-box"
                    style={{ maxWidth: 160 }}
                    disabled={takenRoles.has(lineupRole)}
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
