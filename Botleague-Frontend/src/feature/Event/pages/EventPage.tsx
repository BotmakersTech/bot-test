// ======================================================
// SearchEvents.tsx
// Role-aware: Captain → full control | Member → view only
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../hook/useEvent";
import { useAppSelector } from "../../../app/hooks";
import { selectRobots } from "../../Robots/store/robotsSlice";
import TierBadge from "../../../shared/components/TierBadge";
import CategoryBadge from "../../../shared/components/CategoryBadge";
import { useEligibility } from "../../Eligibility/hooks/useEligibility";
import { getEventSponsors, type EventSponsor } from "../api/eventSponsor.api";
import { getSportSponsors, type SportSponsor } from "../api/sportSponsor.api";
import SponsorStrip from "../../../shared/components/SponsorStrip";

import type {
  EventRegistrationResponse,
  EventResponse,
  EventSportResponse,
  TeamLineUpResponse,
  LineupRole,
} from "../api/event.api";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = "#3a3a3a";
const CARD    = "rgba(0,0,0,0.25)";
const CARD2   = "rgba(0,0,0,0.35)";
const BORDER  = "rgba(255,255,255,0.08)";
const ACCENT  = "#fa4715";
const ACCENT2 = "#f97316";
const BTN_RED = "#ff4d4d";
const TEXT    = "#ffffff";
const MUTED   = "#9ca3af";
const LABEL   = "#e5e7eb";
const SUCCESS = "#4ade80";
const DANGER  = "#f87171";
const WARNING = "#fbbf24";
const INFO    = "#60a5fa";

// ─── Shared: Spinner ─────────────────────────────────────────────────────────
function Spinner({ size = 16, color = ACCENT }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: `2px solid rgba(255,255,255,0.12)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
    }} />
  );
}

// ─── Shared: Error Banner ─────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry, onDismiss }: { message: string; onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <div style={{
      background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)",
      borderRadius: "10px", padding: "11px 16px",
      display: "flex", alignItems: "center", gap: "10px",
      fontSize: "0.83rem", fontWeight: 600, color: DANGER,
      animation: "fadeSlideIn 0.25s ease",
    }}>
      <span style={{ flexShrink: 0 }}>⚠️</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: "rgba(248,113,113,0.14)", border: "1px solid rgba(248,113,113,0.28)",
          color: DANGER, borderRadius: "6px", padding: "4px 12px",
          fontSize: "0.77rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
        }}>Retry</button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: "0 2px", fontSize: "13px" }}>✕</button>
      )}
    </div>
  );
}

// ─── Shared: Role Gate Banner (shown to non-captains) ─────────────────────────
function ViewOnlyBanner() {
  return (
    <div style={{
      background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.22)",
      borderRadius: "10px", padding: "10px 16px",
      display: "flex", alignItems: "center", gap: "10px",
      fontSize: "0.82rem", fontWeight: 600, color: INFO,
      marginBottom: "16px",
    }}>
      <span>👁</span>
      <span>You're viewing as a <strong>Team Member</strong>. Only the Captain can register, cancel, or manage the lineup.</span>
    </div>
  );
}

// ─── Shared: Chip ────────────────────────────────────────────────────────────
const chip = (active = false): React.CSSProperties => ({
  background:   active ? "rgba(250,71,21,0.13)" : "rgba(255,255,255,0.06)",
  border:       `1px solid ${active ? "rgba(250,71,21,0.35)" : BORDER}`,
  color:        active ? ACCENT : LABEL,
  borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px",
  display: "inline-flex", alignItems: "center",
});

// ─── Shared: Status Pill ──────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const MAP: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    PUBLISHED:           { bg: "rgba(250,71,21,0.11)",  border: "rgba(250,71,21,0.28)",   color: ACCENT,   icon: "📣" },
    LIVE:                { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS,  icon: "🟢" },
    COMPLETED:           { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.25)", color: MUTED,    icon: "✅" },
    REGISTRATION_OPEN:   { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS,  icon: "🔓" },
    REGISTRATION_CLOSED: { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  color: WARNING,  icon: "🔒" },
  };
  const s = MAP[status] ?? MAP["PUBLISHED"];
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      {s.icon} {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Flow Steps ───────────────────────────────────────────────────────────────
function FlowSteps({
  hasSelectedEvent,
  hasRegistrations,
}: { hasSelectedEvent: boolean; hasRegistrations: boolean }) {
  const steps = [
    { n: "1", label: "Browse Events", done: hasSelectedEvent,  active: !hasSelectedEvent },
    { n: "2", label: "Choose Sport",  done: hasRegistrations,  active: hasSelectedEvent && !hasRegistrations },
    { n: "3", label: "Register Team", done: hasRegistrations,  active: hasSelectedEvent },
    { n: "4", label: "Build Lineup",  done: false,             active: hasRegistrations },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0", marginBottom: "28px" }}>
      {steps.map((step, i) => (
        <div key={step.n} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: step.done
                ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`
                : step.active ? "rgba(250,71,21,0.18)" : "rgba(255,255,255,0.06)",
              border: `2px solid ${step.done || step.active ? ACCENT : BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 700,
              color: step.done ? "#fff" : step.active ? ACCENT : MUTED,
              transition: "all 0.3s",
            }}>
              {step.done ? "✓" : step.n}
            </div>
            <span style={{
              fontSize: "0.76rem", fontWeight: 600, whiteSpace: "nowrap",
              color: step.done || step.active ? TEXT : MUTED,
              transition: "color 0.3s",
            }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: "24px", height: "1px", background: step.done ? "rgba(250,71,21,0.4)" : BORDER, margin: "0 8px", flexShrink: 0, transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Module-level date formatter ─────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ──────────────────────────────────────────────────────────────────────────────
// EVENT CARD
// ──────────────────────────────────────────────────────────────────────────────
interface EventCardProps {
  event:        EventResponse;
  isRegistered: boolean;
  isSelected:   boolean;
  onSelect:     () => void;
}

function EventCard({ event, isRegistered, isSelected, onSelect }: EventCardProps) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   isSelected ? "rgba(250,71,21,0.07)" : CARD,
        border:       `1px solid ${isSelected ? "rgba(250,71,21,0.42)" : hov ? "rgba(250,71,21,0.22)" : BORDER}`,
        borderRadius: "14px", padding: "18px", cursor: "pointer",
        transition:   "all 0.22s ease", position: "relative", overflow: "hidden",
        transform:    hov && !isSelected ? "translateY(-2px)" : "none",
        boxShadow:    isSelected
          ? "0 0 0 1px rgba(250,71,21,0.15), 0 8px 28px rgba(0,0,0,0.45)"
          : hov ? "0 6px 20px rgba(0,0,0,0.3)" : "none",
      }}
    >
      {isSelected && (
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top left, rgba(250,71,21,0.06), transparent 60%)", pointerEvents: "none" }} />
      )}
      {isSelected && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "14px 0 0 14px" }} />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "10px", flexShrink: 0,
            background: event.eventLogoUrl
              ? `url(${event.eventLogoUrl}) center/cover no-repeat`
              : `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}>
            {!event.eventLogoUrl && "🏆"}
          </div>
          <div>
            <div style={{ color: TEXT, fontWeight: 700, fontSize: "0.92rem", marginBottom: "2px" }}>{event.eventName}</div>
            <div style={{ color: MUTED, fontSize: "0.73rem" }}>{event.eventCode}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px", flexShrink: 0 }}>
          <TierBadge tier={event.tier} size="sm" />
          {isRegistered
            ? <span style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.28)", color: SUCCESS, borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700, whiteSpace: "nowrap" }}>✅ Registered</span>
            : <StatusPill status={event.status} />
          }
        </div>
      </div>
      <div style={{ height: "1px", background: BORDER, marginBottom: "11px" }} />
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
        {event.venueName        && <span style={chip()}>📍 {event.venueName}</span>}
        {event.city             && <span style={chip()}>🌆 {[event.city, event.state].filter(Boolean).join(", ")}</span>}
        {event.startDate        && <span style={chip()}>📅 {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
        {event.organizationName && <span style={chip()}>🏛 {event.organizationName}</span>}
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: isSelected ? "rgba(250,71,21,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isSelected ? "rgba(250,71,21,0.25)" : BORDER}`,
        borderRadius: "8px", padding: "8px 12px", transition: "all 0.2s",
      }}>
        <span style={{ color: isSelected ? ACCENT : MUTED, fontSize: "0.78rem", fontWeight: 600 }}>
          {isSelected ? "Viewing sport categories" : "View sport categories"}
        </span>
        <span style={{ color: isSelected ? ACCENT : MUTED, fontSize: "0.85rem" }}>
          {isSelected ? "▼" : "▶"}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SPORT CARD — own component so hooks (sponsors fetch) are at top level
// ──────────────────────────────────────────────────────────────────────────────
interface SportCardProps {
  sport:          EventSportResponse;
  reg:            EventRegistrationResponse | undefined;
  teamId:         string;
  isCaptain:      boolean;
  busySportId:    string | null;
  userCategory?:  string | null;
  onRegister:     (sport: EventSportResponse) => void;
  onManageLineup: (reg: EventRegistrationResponse) => void;
  onCancelReg:    (registrationId: string) => Promise<void>;
}

function SportCard({
  sport, reg, teamId, isCaptain, busySportId, userCategory,
  onRegister, onManageLineup, onCancelReg,
}: SportCardProps) {
  const [sponsors, setSponsors] = useState<SportSponsor[]>([]);

  useEffect(() => {
    getSportSponsors(sport.id).then(setSponsors).catch(() => setSponsors([]));
  }, [sport.id]);

  const isReg            = !!reg;
  const isBusy           = busySportId === sport.id;
  const spotsLeft        = sport.maxTeams - sport.registeredTeamsCount;
  const isFull           = spotsLeft <= 0;
  const regOpen          = sport.status === "REGISTRATION_OPEN";
  const categoryMismatch = !!(sport.ageGroup && userCategory && sport.ageGroup !== userCategory);
  const canAct           = isCaptain && !isFull && regOpen && !categoryMismatch;

  return (
    <div style={{
      background:   isReg ? "rgba(74,222,128,0.04)" : CARD,
      border:       `1px solid ${isReg ? "rgba(74,222,128,0.2)" : BORDER}`,
      borderRadius: "12px", padding: "16px",
      transition:   "border 0.2s", position: "relative", overflow: "hidden",
    }}>
      {isReg && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: `linear-gradient(to bottom, ${SUCCESS}, rgba(74,222,128,0.4))` }} />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
        <div>
          <div style={{ color: TEXT, fontWeight: 700, fontSize: "0.9rem", marginBottom: "3px" }}>{sport.sport}</div>
          {sport.sportsDescription && <div style={{ color: MUTED, fontSize: "0.75rem" }}>{sport.sportsDescription}</div>}
        </div>
        <StatusPill status={sport.status} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))", gap: "7px", marginBottom: "12px" }}>
        {[
          { label: "Format",      value: sport.formatType },
          { label: "Team Size",   value: `${sport.minTeamSize}–${sport.maxTeamSize}` },
          { label: "Entry Fee",   value: sport.entryFee > 0 ? `₹${sport.entryFee}` : "Free" },
          { label: "Prize",       value: sport.prizeMoney > 0 ? `₹${sport.prizeMoney}` : "—" },
          { label: "Slots Left",  value: isFull ? "Full" : `${spotsLeft} / ${sport.maxTeams}`, danger: isFull },
          { label: "Reg. Closes", value: fmtDate(sport.registrationEndDate) },
        ].map(({ label, value, danger }) => (
          <div key={label} style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ color: MUTED, fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "3px" }}>{label}</div>
            <div style={{ color: danger ? DANGER : TEXT, fontWeight: 700, fontSize: "0.81rem" }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: "12px" }}>
        {sport.ageGroup    && <CategoryBadge category={sport.ageGroup} size="xs" showAgeRange />}
        {sport.weightClass && <span style={chip()}>⚖️ {sport.weightClass}</span>}
        {categoryMismatch && (
          <span style={{ fontSize: "0.63rem", color: "#f87171", fontWeight: 600, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "6px", padding: "2px 7px" }}>
            Not eligible for your category
          </span>
        )}
      </div>

      {/* ACTION ZONE */}
      {!teamId ? (
        <div style={{ color: MUTED, fontSize: "0.8rem", textAlign: "center", padding: "10px", background: "rgba(0,0,0,0.15)", borderRadius: "8px" }}>
          Login to register your team
        </div>
      ) : isReg ? (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.22)", color: SUCCESS, borderRadius: "8px", padding: "9px 12px", fontSize: "0.8rem", fontWeight: 700, textAlign: "center", minWidth: "120px" }}>
            ✅ {reg!.teamName} registered
          </div>
          {isCaptain ? (
            <button onClick={() => onManageLineup(reg!)}
              style={{ background: "rgba(250,71,21,0.08)", border: "1px solid rgba(250,71,21,0.22)", color: ACCENT, borderRadius: "8px", padding: "9px 14px", fontSize: "0.79rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,71,21,0.17)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(250,71,21,0.08)")}>
              👥 Manage Lineup →
            </button>
          ) : (
            <button onClick={() => onManageLineup(reg!)}
              style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.22)", color: INFO, borderRadius: "8px", padding: "9px 14px", fontSize: "0.79rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(96,165,250,0.16)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(96,165,250,0.08)")}>
              👁 View Lineup
            </button>
          )}
          {isCaptain && (
            <button onClick={() => onCancelReg(reg!.registrationId)} disabled={isBusy}
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", color: DANGER, borderRadius: "8px", padding: "9px 12px", fontSize: "0.79rem", fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s" }}
              onMouseEnter={(e) => !isBusy && (e.currentTarget.style.background = "rgba(248,113,113,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}>
              {isBusy ? <Spinner size={12} color={DANGER} /> : "✕"}
              {isBusy ? "Cancelling…" : "Cancel"}
            </button>
          )}
        </div>
      ) : isCaptain ? (
        <button
          onClick={() => canAct && !isBusy && onRegister(sport)}
          disabled={isBusy || isFull || !regOpen || categoryMismatch}
          style={{
            width: "100%",
            background: isFull || !regOpen || categoryMismatch ? "rgba(255,255,255,0.05)" : isBusy ? "rgba(250,71,21,0.1)" : "linear-gradient(135deg, rgba(255,77,77,0.18), rgba(250,71,21,0.18))",
            border: `1px solid ${isFull || !regOpen || categoryMismatch ? BORDER : isBusy ? "rgba(250,71,21,0.3)" : "rgba(250,71,21,0.38)"}`,
            color: isFull || !regOpen || categoryMismatch ? MUTED : ACCENT,
            borderRadius: "8px", padding: "10px", fontSize: "0.82rem", fontWeight: 700,
            cursor: isFull || !regOpen || isBusy || categoryMismatch ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "all 0.2s", opacity: isFull || !regOpen || categoryMismatch ? 0.55 : 1,
          }}
          onMouseEnter={(e) => { if (canAct && !isBusy) e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,77,77,0.28), rgba(250,71,21,0.28))"; }}
          onMouseLeave={(e) => { if (canAct && !isBusy) e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,77,77,0.18), rgba(250,71,21,0.18))"; }}
        >
          {isBusy && <Spinner size={14} />}
          {isBusy ? "Registering…" : isFull ? "🚫 Slots Full" : !regOpen ? "🔒 Registration Closed" : categoryMismatch ? "🚫 Wrong Age Category" : "Register Team →"}
        </button>
      ) : (
        <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.18)", color: INFO, borderRadius: "8px", padding: "9px 14px", fontSize: "0.79rem", fontWeight: 600, textAlign: "center" }}>
          {isFull ? "🚫 Slots Full" : !regOpen ? "🔒 Registration Closed" : "👁 Only the Captain can register"}
        </div>
      )}

      {/* SPORT SPONSORS */}
      {sponsors.length > 0 && (
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: `1px solid ${BORDER}` }}>
          <SponsorStrip sponsors={sponsors} compact />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SPORTS PANEL
// ──────────────────────────────────────────────────────────────────────────────
interface SportsPanelProps {
  event:          EventResponse;
  sports:         EventSportResponse[];
  registrations:  EventRegistrationResponse[];
  teamId:         string;
  isCaptain:      boolean;
  loading:        boolean;
  error:          string | null;
  busySportId:    string | null;
  onRegister:     (sport: EventSportResponse) => void;
  onManageLineup: (reg: EventRegistrationResponse) => void;
  onCancelReg:    (registrationId: string) => Promise<void>;
  onRetry:        () => void;
  userCategory?:  string | null;
  eventSponsors?: EventSponsor[];
}

function SportsPanel({
  event, sports, registrations, teamId, isCaptain,
  loading, error, busySportId,
  onRegister, onManageLineup, onCancelReg, onRetry,
  userCategory, eventSponsors,
}: SportsPanelProps) {
  const getRegForSport = (sportId: string) =>
    registrations.find((r) => r.eventSportId === sportId && r.teamId === teamId);

  return (
    <div style={{
      background: CARD2, border: "1px solid rgba(250,71,21,0.18)",
      borderRadius: "16px", overflow: "hidden",
      boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        padding: "16px 20px", borderBottom: `1px solid ${BORDER}`,
        background: "rgba(250,71,21,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "8px",
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
          }}>🏅</div>
          <div>
            <div style={{ color: TEXT, fontWeight: 700, fontSize: "0.88rem", fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.05em" }}>
              {event.eventName}
            </div>
            <div style={{ color: MUTED, fontSize: "0.73rem", marginTop: "1px" }}>
              {isCaptain ? "Select a sport to register your team" : "Viewing available sports"}
            </div>
          </div>
        </div>
        <span style={{
          background:   isCaptain ? "rgba(250,71,21,0.12)" : "rgba(96,165,250,0.1)",
          border:       `1px solid ${isCaptain ? "rgba(250,71,21,0.3)" : "rgba(96,165,250,0.25)"}`,
          color:        isCaptain ? ACCENT : INFO,
          borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700, whiteSpace: "nowrap",
        }}>
          {isCaptain ? "⚡ Captain" : "👁 View Only"}
        </span>
      </div>
      {eventSponsors && eventSponsors.length > 0 && (
        <div style={{ padding: "0 20px 12px" }}>
          <SponsorStrip sponsors={eventSponsors} compact />
        </div>
      )}

      <div style={{ padding: "16px 20px" }}>
        {loading && sports.length === 0 && (
          <div style={{ textAlign: "center", padding: "36px 0", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <Spinner size={20} /> Loading sport categories…
          </div>
        )}
        {error && !loading && <ErrorBanner message={error} onRetry={onRetry} />}
        {!loading && !error && sports.length === 0 && (
          <div style={{ textAlign: "center", padding: "36px 0", color: MUTED }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🏜️</div>
            <div style={{ fontSize: "0.85rem" }}>No sport categories found for this event.</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sports.map((sport) => (
            <SportCard
              key={sport.id}
              sport={sport}
              reg={getRegForSport(sport.id)}
              teamId={teamId}
              isCaptain={isCaptain}
              busySportId={busySportId}
              userCategory={userCategory}
              onRegister={onRegister}
              onManageLineup={onManageLineup}
              onCancelReg={onCancelReg}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// LINEUP MODAL
// ──────────────────────────────────────────────────────────────────────────────
interface LineupModalProps {
  registration:  EventRegistrationResponse;
  teamMembers:   Array<{ userId: string; teamMemberId: string; teamRole: string; userName?: string }>;
  lineup:        TeamLineUpResponse[];
  lineupLoading: boolean;
  lineupError:   string | null;
  isCaptain:     boolean;
  onFetchLineup: (id: string) => Promise<void>;
  onAddMember:   (regId: string, memberId: string, role: string) => Promise<boolean>;
  onRemove:      (lineupId: string) => Promise<boolean>;
  onClose:       () => void;
}

function LineupModal({
  registration, teamMembers, lineup, lineupLoading, lineupError, isCaptain,
  onFetchLineup, onAddMember, onRemove, onClose,
}: LineupModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [lineupRole,       setLineupRole]       = useState("");
  const [addLoading,       setAddLoading]       = useState(false);
  const [addError,         setAddError]         = useState<string | null>(null);
  const [removeLoading,    setRemoveLoading]    = useState<string | null>(null);

  useEffect(() => {
    onFetchLineup(registration.registrationId);
  }, [registration.registrationId]);

  const handleAdd = async () => {
    if (!selectedMemberId || !lineupRole.trim()) return;
    setAddLoading(true); setAddError(null);
    const ok = await onAddMember(registration.registrationId, selectedMemberId, lineupRole.trim());
    if (ok) { setSelectedMemberId(""); setLineupRole(""); }
    else     setAddError("Failed to add member. Please try again.");
    setAddLoading(false);
  };

  const handleRemove = async (lineupId: string) => {
    setRemoveLoading(lineupId);
    await onRemove(lineupId);
    setRemoveLoading(null);
  };

  const canAdd           = !!selectedMemberId && !!lineupRole.trim() && !addLoading && !registration.lineupLocked && isCaptain;
  const addedMemberIds   = new Set(lineup.map((l) => l.teamMembershipId ?? "").filter(Boolean));
  const availableMembers = teamMembers.filter((m) => !addedMemberIds.has(m.teamMemberId));
  const pct              = (registration.lineupSize ?? 0) > 0 ? (lineup.length / (registration.lineupSize ?? 1)) * 100 : 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "linear-gradient(160deg, #2e2e2e 0%, #1e1e1e 100%)",
        border: `1px solid ${isCaptain ? "rgba(250,71,21,0.22)" : "rgba(96,165,250,0.22)"}`,
        borderRadius: "20px", padding: "28px",
        width: "100%", maxWidth: "520px", maxHeight: "88vh", overflowY: "auto",
        boxShadow: "0 28px 70px rgba(0,0,0,0.65)",
        animation: "fadeSlideIn 0.25s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "4px", height: "36px", background: isCaptain ? `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})` : `linear-gradient(to bottom, ${INFO}, rgba(96,165,250,0.4))`, borderRadius: "2px" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, fontFamily: "'Orbitron', sans-serif", color: TEXT, letterSpacing: "0.08em" }}>
                {isCaptain ? "LINEUP MANAGER" : "TEAM LINEUP"}
              </h2>
              <p style={{ margin: "3px 0 0", color: MUTED, fontSize: "0.78rem" }}>{registration.teamName}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              background: isCaptain ? "rgba(250,71,21,0.12)" : "rgba(96,165,250,0.1)",
              border: `1px solid ${isCaptain ? "rgba(250,71,21,0.3)" : "rgba(96,165,250,0.25)"}`,
              color: isCaptain ? ACCENT : INFO,
              borderRadius: "999px", fontSize: "0.65rem", padding: "3px 9px", fontWeight: 700,
            }}>
              {isCaptain ? "⚡ Captain" : "👁 View Only"}
            </span>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: MUTED, borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>✕</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "16px 0 12px" }}>
          <span style={chip()}>👥 {lineup.length} / {registration.lineupSize} members</span>
          <span style={{ ...chip(), color: registration.lineupLocked ? DANGER : SUCCESS, borderColor: registration.lineupLocked ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)", background: registration.lineupLocked ? "rgba(248,113,113,0.08)" : "rgba(74,222,128,0.08)" }}>
            {registration.lineupLocked ? "🔒 Lineup Locked" : "🔓 Lineup Open"}
          </span>
          <span style={{ ...chip(), color: registration.checkedIn ? SUCCESS : MUTED }}>
            {registration.checkedIn ? "✅ Checked In" : "⏳ Not Checked In"}
          </span>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "999px", height: "6px", marginBottom: "20px", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: "999px", width: `${pct}%`, background: `linear-gradient(to right, ${isCaptain ? ACCENT : INFO}, ${isCaptain ? ACCENT2 : "rgba(96,165,250,0.6)"})`, transition: "width 0.4s ease" }} />
        </div>

        {lineupError && !lineupLoading && (
          <div style={{ marginBottom: "16px" }}>
            <ErrorBanner message={lineupError} onRetry={() => onFetchLineup(registration.registrationId)} />
          </div>
        )}

        {!isCaptain && !registration.lineupLocked && (
          <div style={{ background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "10px", padding: "10px 14px", color: INFO, fontSize: "0.78rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>👁</span>
            <span>You can view the lineup. Only the Captain can add or remove members.</span>
          </div>
        )}

        {isCaptain && !registration.lineupLocked && (
          <div style={{ background: "rgba(0,0,0,0.22)", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <div style={{ fontSize: "0.65rem", color: MUTED, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
              ➕ Add Member to Lineup
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                style={{ flex: 2, minWidth: "150px", background: "rgba(0,0,0,0.35)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: selectedMemberId ? TEXT : "#6b7280", fontSize: "0.82rem", outline: "none", cursor: "pointer" }}
              >
                <option value="">Select Member</option>
                {availableMembers.length === 0 && teamMembers.length > 0 && <option disabled>All members already added</option>}
                {availableMembers.map((m) => (
                  <option key={m.teamMemberId} value={m.teamMemberId}>
                    {m.userName || m.userId} ({m.teamRole})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Role (e.g. Driver)"
                value={lineupRole}
                onChange={(e) => setLineupRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAdd && handleAdd()}
                style={{ flex: 1, minWidth: "110px", background: "rgba(0,0,0,0.35)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: TEXT, fontSize: "0.82rem", outline: "none", fontFamily: "inherit" }}
              />
              <button
                onClick={handleAdd}
                disabled={!canAdd}
                style={{ background: canAdd ? `linear-gradient(135deg, ${BTN_RED}, ${ACCENT})` : "rgba(255,255,255,0.06)", border: "none", color: canAdd ? "#fff" : "#6b7280", borderRadius: "8px", padding: "9px 16px", cursor: canAdd ? "pointer" : "not-allowed", fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
              >
                {addLoading ? <Spinner size={13} color="#fff" /> : null}
                {addLoading ? "Adding…" : "+ Add"}
              </button>
            </div>
            {addError && <div style={{ marginTop: "8px", color: DANGER, fontSize: "0.76rem", fontWeight: 600 }}>⚠️ {addError}</div>}
          </div>
        )}

        {lineupLoading && lineup.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <Spinner size={18} /> Loading lineup…
          </div>
        ) : lineup.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>👤</div>
            <div style={{ color: MUTED, fontSize: "0.85rem" }}>
              {isCaptain ? "No members added yet. Select members above to build your lineup." : "No members have been added to the lineup yet."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "0.65rem", color: MUTED, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
              Current Lineup ({lineup.length})
            </div>
            {lineup.map((member, idx) => {
              const isRemoving = removeLoading === member.lineupId;
              return (
                <div key={member.lineupId} style={{ background: "rgba(0,0,0,0.22)", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", opacity: isRemoving ? 0.5 : 1, transition: "opacity 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", color: "#fff", flexShrink: 0 }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: TEXT }}>{member.memberName}</div>
                      <div style={{ color: ACCENT, fontSize: "0.74rem", fontWeight: 600 }}>{member.lineupRole}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ background: member.isActive ? "rgba(74,222,128,0.1)" : "rgba(156,163,175,0.1)", border: `1px solid ${member.isActive ? "rgba(74,222,128,0.25)" : "rgba(156,163,175,0.2)"}`, color: member.isActive ? SUCCESS : MUTED, borderRadius: "999px", fontSize: "0.68rem", padding: "2px 9px", fontWeight: 600 }}>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                    {isCaptain && !registration.lineupLocked && (
                      <button
                        onClick={() => handleRemove(member.lineupId)}
                        disabled={isRemoving}
                        style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: DANGER, borderRadius: "6px", width: "28px", height: "28px", cursor: isRemoving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
                        onMouseEnter={(e) => !isRemoving && (e.currentTarget.style.background = "rgba(248,113,113,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
                      >
                        {isRemoving ? <Spinner size={11} color={DANGER} /> : <span style={{ fontSize: "11px" }}>✕</span>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {registration.lineupLocked && (
          <div style={{ marginTop: "16px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px", padding: "10px 14px", color: WARNING, fontSize: "0.78rem", fontWeight: 600 }}>
            🔒 Lineup is locked. {isCaptain ? "Contact the organizer to make changes." : "No further changes can be made."}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ROBOT PICKER MODAL — shown when captain clicks "Register Team →"
// ──────────────────────────────────────────────────────────────────────────────
interface RobotPickerModalProps {
  sport:   EventSportResponse;
  robots:  Array<{ id: string; robotName: string; status: string }>;
  busy:    boolean;
  onConfirm: (robotId: string, robotName: string) => void;
  onClose:   () => void;
}

function RobotPickerModal({ sport, robots, busy, onConfirm, onClose }: RobotPickerModalProps) {
  const activeRobots = robots.filter((r) => r.status === "ACTIVE");
  const [selected, setSelected] = useState(activeRobots.length === 1 ? activeRobots[0].id : "");

  const robot = activeRobots.find((r) => r.id === selected);
  const canConfirm = !!robot && !busy;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "20px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "linear-gradient(160deg, #2e2e2e 0%, #1e1e1e 100%)", border: "1px solid rgba(250,71,21,0.22)", borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 28px 70px rgba(0,0,0,0.65)", animation: "fadeSlideIn 0.22s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, fontFamily: "'Orbitron', sans-serif", color: TEXT, letterSpacing: "0.07em" }}>SELECT ROBOT</h2>
            <p style={{ margin: "4px 0 0", color: MUTED, fontSize: "0.76rem" }}>Registering for: {sport.sport}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: MUTED, borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>✕</button>
        </div>

        {activeRobots.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: MUTED }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🤖</div>
            <div style={{ fontSize: "0.83rem" }}>No active robots. Create a robot in your team page first.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {activeRobots.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelected(r.id)}
                style={{ background: selected === r.id ? "rgba(250,71,21,0.09)" : "rgba(0,0,0,0.22)", border: `1px solid ${selected === r.id ? "rgba(250,71,21,0.35)" : BORDER}`, borderRadius: "10px", padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", transition: "all 0.15s" }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: selected === r.id ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>🤖</div>
                <div>
                  <div style={{ color: TEXT, fontWeight: 600, fontSize: "0.88rem" }}>{r.robotName}</div>
                  <div style={{ color: MUTED, fontSize: "0.7rem", marginTop: "1px" }}>ACTIVE</div>
                </div>
                {selected === r.id && <span style={{ marginLeft: "auto", color: ACCENT, fontSize: "1rem" }}>✓</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "10px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => robot && onConfirm(robot.id, robot.robotName)}
            disabled={!canConfirm}
            style={{ flex: 2, background: canConfirm ? `linear-gradient(135deg, ${BTN_RED}, ${ACCENT})` : "rgba(255,255,255,0.05)", border: `1px solid ${canConfirm ? "rgba(250,71,21,0.38)" : BORDER}`, color: canConfirm ? "#fff" : "#6b7280", borderRadius: "8px", padding: "10px", fontSize: "0.82rem", fontWeight: 700, cursor: canConfirm ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {busy ? <Spinner size={13} color="#fff" /> : null}
            {busy ? "Registering…" : "Register →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN — SearchEvents
// ──────────────────────────────────────────────────────────────────────────────
export default function SearchEvents() {
  const navigate = useNavigate();

  // ── All team + role data comes from the hook — single source of truth ──────
  const {
    events, eventSports, registrations, lineup,
    loading, error,
    teamId, teamMembers, isCaptain,
    fetchLiveEvents, fetchEventSports, fetchTeamRegistrations,
    registerTeam, cancelRegistration,
    addMemberToLineup, fetchLineup, removeMemberFromLineup,
  } = useEvent();

  const robots = useAppSelector(selectRobots);
  const { eligibility } = useEligibility();

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [lineupModal,   setLineupModal]   = useState<EventRegistrationResponse | null>(null);
  const [lineupLoading, setLineupLoading] = useState(false);
  const [lineupError,   setLineupError]   = useState<string | null>(null);
  const [eventsError,   setEventsError]   = useState<string | null>(null);
  const [sportsError,   setSportsError]   = useState<string | null>(null);
  const [busySportId,     setBusySportId]     = useState<string | null>(null);
  const [regError,        setRegError]        = useState<string | null>(null);
  const [robotPickSport,  setRobotPickSport]  = useState<EventSportResponse | null>(null);
  const [eventSponsors,   setEventSponsors]   = useState<EventSponsor[]>([]);

  // ── On mount ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setEventsError(null);
      try { await fetchLiveEvents(); }
      catch (err: any) { setEventsError(err?.response?.data?.error ?? err?.message ?? "Failed to load events."); }
    };
    load();
  }, []);

  useEffect(() => {
    if (teamId) fetchTeamRegistrations(teamId);
  }, [teamId]);

  // ── Select event → fetch sports + sponsors ────────────────────────────────
  const handleSelectEvent = async (event: EventResponse) => {
    if (selectedEvent?.id === event.id) { setSelectedEvent(null); setEventSponsors([]); return; }
    setSelectedEvent(event);
    setSportsError(null);
    try { await fetchEventSports(event.id); }
    catch (err: any) { setSportsError(err?.response?.data?.error ?? err?.message ?? "Failed to load sports."); }
    try { const sponsors = await getEventSponsors(event.id); setEventSponsors(sponsors); }
    catch { setEventSponsors([]); }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredEvents = events.filter((e) =>
    !search ||
    e.eventName?.toLowerCase().includes(search.toLowerCase()) ||
    e.eventCode?.toLowerCase().includes(search.toLowerCase()) ||
    e.city?.toLowerCase().includes(search.toLowerCase())
  );

  const isEventRegistered = (eventId: string) =>
    registrations.some((r) => r.eventId === eventId && r.teamId === teamId);

  // ── Register — step 1: open robot picker ──────────────────────────────────
  const handleRegister = (sport: EventSportResponse) => {
    if (!teamId) { navigate("/login"); return; }
    setRegError(null);
    setRobotPickSport(sport);
  };

  // ── Register — step 2: called when robot is chosen from the picker ────────
  const handleConfirmRegister = async (robotId: string, robotName: string) => {
    if (!robotPickSport || !teamId) return;
    const sport = robotPickSport;
    setBusySportId(sport.id);
    setRegError(null);
    try {
      const result = await registerTeam({ eventSportId: sport.id, teamId, botId: robotId, robotId: robotId, robotName });
      if (!result) throw new Error("Registration failed.");
      setRobotPickSport(null);
      await fetchTeamRegistrations(teamId);
    } catch (err: any) {
      setRegError(err?.response?.data?.error ?? err?.message ?? "Registration failed.");
    } finally {
      setBusySportId(null);
    }
  };

  // ── Cancel registration ────────────────────────────────────────────────────
  const handleCancelReg = async (registrationId: string) => {
    setRegError(null);
    const ok = await cancelRegistration(registrationId);
    if (!ok) { setRegError(error ?? "Failed to cancel registration."); return; }
    if (teamId) fetchTeamRegistrations(teamId);
  };

  // ── Lineup ─────────────────────────────────────────────────────────────────
  const handleOpenLineup   = (reg: EventRegistrationResponse) => { setLineupModal(reg); setLineupError(null); };

  const handleFetchLineup  = async (id: string) => {
    setLineupLoading(true); setLineupError(null);
    try { await fetchLineup(id); }
    catch (err: any) { setLineupError(err?.response?.data?.error ?? err?.message ?? "Failed to load lineup."); }
    finally { setLineupLoading(false); }
  };

  const handleAddMember = async (regId: string, memberId: string, role: string): Promise<boolean> => {
    const reg = registrations.find((r) => (r.registrationId ?? r.id) === regId);
    const robotId = reg?.robotId ?? reg?.botId ?? "";
    if (!robotId) {
      // Registration record is missing the robot ID — surface a clear error
      setRegError("Robot not found for this registration. Please refresh and try again.");
      return false;
    }
    return (await addMemberToLineup({
      sportRegistrationId: regId,
      robotId,
      teamMembershipId:    memberId,
      lineupRole:          role as LineupRole,
    })) !== null;
  };

  const handleRemoveMember = async (lineupId: string): Promise<boolean> =>
    removeMemberFromLineup(lineupId);

  const hasRegistrations = registrations.length > 0;
  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: BG, width: "100%", padding: "40px 48px", color: TEXT, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        select option          { background: #2e2e2e; color: #fff; }
        ::-webkit-scrollbar    { width: 5px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(250,71,21,0.35); border-radius: 3px; }
      `}</style>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2}, transparent)` }} />
      <div style={{ position: "absolute", top: "-120px", right: "-120px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(250,71,21,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "4px", height: "34px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", boxShadow: "0 0 10px rgba(250,71,21,0.5)" }} />
            <h1 style={{ margin: 0, fontSize: "1.9rem", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>FIND EVENTS</h1>
          </div>
          <div style={{ marginLeft: "16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <p style={{ margin: 0, color: MUTED, fontSize: "0.85rem" }}>Discover, register, and build your competition lineup</p>
            {teamId && (
              <span style={{ background: isCaptain ? "rgba(250,71,21,0.12)" : "rgba(96,165,250,0.1)", border: `1px solid ${isCaptain ? "rgba(250,71,21,0.3)" : "rgba(96,165,250,0.25)"}`, color: isCaptain ? ACCENT : INFO, borderRadius: "999px", fontSize: "0.7rem", padding: "3px 11px", fontWeight: 700 }}>
                {isCaptain ? "⚡ Captain — Full Access" : "👁 Member — View Only"}
              </span>
            )}
          </div>
        </div>

        <FlowSteps hasSelectedEvent={!!selectedEvent} hasRegistrations={hasRegistrations} />
        {teamId && !isCaptain && <ViewOnlyBanner />}

        {/* REGISTRATIONS BAR */}
        {registrations.length > 0 && (
          <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.16)", borderRadius: "12px", padding: "12px 18px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", animation: "fadeSlideIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>✅</span>
              <span style={{ color: SUCCESS, fontWeight: 700, fontSize: "0.85rem" }}>
                {registrations.length} sport{registrations.length > 1 ? "s" : ""} registered
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {registrations.map((reg) => (
                <button
                  key={reg.registrationId}
                  onClick={() => handleOpenLineup(reg)}
                  style={{ background: isCaptain ? "rgba(74,222,128,0.09)" : "rgba(96,165,250,0.09)", border: `1px solid ${isCaptain ? "rgba(74,222,128,0.2)" : "rgba(96,165,250,0.2)"}`, color: isCaptain ? SUCCESS : INFO, borderRadius: "8px", padding: "5px 12px", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isCaptain ? "rgba(74,222,128,0.18)" : "rgba(96,165,250,0.18)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isCaptain ? "rgba(74,222,128,0.09)" : "rgba(96,165,250,0.09)")}
                >
                  {reg.teamName} · {isCaptain ? "Manage Lineup →" : "View Lineup →"}
                </button>
              ))}
            </div>
          </div>
        )}

        {regError && (
          <div style={{ marginBottom: "16px", animation: "fadeSlideIn 0.3s ease" }}>
            <ErrorBanner message={regError} onDismiss={() => setRegError(null)} />
          </div>
        )}

        {/* SEARCH */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", background: searchFocused ? "rgba(0,0,0,0.45)" : CARD, border: searchFocused ? `1px solid ${ACCENT}` : `1px solid ${BORDER}`, borderRadius: "12px", padding: "0 18px", transition: "all 0.2s", boxShadow: searchFocused ? "0 0 0 3px rgba(250,71,21,0.1)" : "none" }}>
            <span style={{ fontSize: "17px", marginRight: "12px", opacity: 0.45 }}>🔍</span>
            <input
              type="text"
              value={search}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by event name, city, or code…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: TEXT, fontSize: "0.92rem", padding: "15px 0" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: MUTED, borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            )}
          </div>
        </div>

        {loading && events.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 0", color: MUTED, display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <Spinner size={40} />
            <div style={{ fontSize: "0.9rem" }}>Loading events…</div>
          </div>
        )}

        {(eventsError || (error && events.length === 0)) && !loading && (
          <div style={{ marginTop: "16px" }}>
            <ErrorBanner message={eventsError ?? error ?? "Failed to load events."} onRetry={() => { setEventsError(null); fetchLiveEvents(); }} />
          </div>
        )}

        {!loading && !eventsError && events.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: selectedEvent ? "1fr 1fr" : "1fr", gap: "20px", alignItems: "start" }}>
            {/* Events column */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.12em", color: ACCENT, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif" }}>Live Events</span>
                <span style={{ background: "rgba(250,71,21,0.13)", border: "1px solid rgba(250,71,21,0.25)", color: ACCENT, borderRadius: "999px", fontSize: "0.7rem", padding: "1px 9px", fontWeight: 700 }}>{filteredEvents.length}</span>
              </div>
              {filteredEvents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: MUTED }}>
                  <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🔎</div>
                  <div style={{ fontSize: "0.85rem" }}>No events match your search.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredEvents.map((event) => (
                    <div key={event.id} style={{ animation: "fadeSlideIn 0.3s ease" }}>
                      <EventCard
                        event={event}
                        isRegistered={isEventRegistered(event.id)}
                        isSelected={selectedEvent?.id === event.id}
                        onSelect={() => handleSelectEvent(event)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sports panel */}
            {selectedEvent && (
              <div style={{ animation: "fadeSlideIn 0.25s ease", position: "sticky", top: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.12em", color: ACCENT, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif" }}>Sport Categories</span>
                  {eventSports.length > 0 && <span style={{ background: "rgba(250,71,21,0.13)", border: "1px solid rgba(250,71,21,0.25)", color: ACCENT, borderRadius: "999px", fontSize: "0.7rem", padding: "1px 9px", fontWeight: 700 }}>{eventSports.length}</span>}
                </div>
                <SportsPanel
                  event={selectedEvent}
                  sports={eventSports}
                  registrations={registrations}
                  teamId={teamId}
                  isCaptain={isCaptain}
                  loading={loading}
                  error={sportsError}
                  busySportId={busySportId}
                  onRegister={handleRegister}
                  onManageLineup={handleOpenLineup}
                  onCancelReg={handleCancelReg}
                  onRetry={() => { setSportsError(null); fetchEventSports(selectedEvent.id); }}
                  userCategory={eligibility?.category ?? null}
                  eventSponsors={eventSponsors}
                />
              </div>
            )}
          </div>
        )}

        {!loading && !eventsError && events.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "35vh", textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "18px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(250,71,21,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "16px" }}>🏟️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontFamily: "'Orbitron', sans-serif", color: LABEL, letterSpacing: "0.06em" }}>NO LIVE EVENTS</h3>
            <p style={{ color: MUTED, fontSize: "0.82rem", maxWidth: "240px" }}>Check back soon for upcoming competitions</p>
          </div>
        )}
      </div>

      {lineupModal && (
        <LineupModal
          registration={lineupModal}
          teamMembers={teamMembers}
          lineup={lineup}
          lineupLoading={lineupLoading}
          lineupError={lineupError}
          isCaptain={isCaptain}
          onFetchLineup={handleFetchLineup}
          onAddMember={handleAddMember}
          onRemove={handleRemoveMember}
          onClose={() => { setLineupModal(null); setLineupError(null); }}
        />
      )}

      {robotPickSport && (
        <RobotPickerModal
          sport={robotPickSport}
          robots={robots}
          busy={busySportId === robotPickSport.id}
          onConfirm={handleConfirmRegister}
          onClose={() => setRobotPickSport(null)}
        />
      )}
    </div>
  );
}