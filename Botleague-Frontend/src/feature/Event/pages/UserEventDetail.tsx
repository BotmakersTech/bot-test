// ======================================================
// UserEventDetail.tsx
// User-facing Event Detail Page
// Route: /events/:eventId
// Uses: useEvent hook → fetchLiveEvents() + fetchEventSports()
// ======================================================

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "../hook/useEvent";
import type { EventResponse, EventSportResponse } from "../api/event.api";
import { useEventRealtime } from "../../../shared/realtime/useEventRealtime";

// ─── Design Tokens ────────────────────────────────────
const BG     = "#3a3a3a";
const CARD   = "rgba(0,0,0,0.25)";
const CARD2  = "rgba(0,0,0,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const ACCENT = "#fa4715";
const ACCENT2= "#f97316";
const TEXT   = "#ffffff";
const MUTED  = "#9ca3af";
const LABEL  = "#e5e7eb";
const SUCCESS= "#4ade80";
const WARNING= "#fbbf24";
const DANGER = "#f87171";

// ─── Helpers ──────────────────────────────────────────
function toLabel(raw?: string | null): string {
  if (!raw) return "—";
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(val?: string | null): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Spinner ──────────────────────────────────────────
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

// ─── Status Pill ──────────────────────────────────────
function StatusPill({ status }: { status?: string }) {
  const MAP: Record<string, { bg: string; border: string; color: string; icon: string }> = {
    PUBLISHED:           { bg: "rgba(250,71,21,0.11)",  border: "rgba(250,71,21,0.28)",   color: ACCENT,  icon: "📣" },
    LIVE:                { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🟢" },
    COMPLETED:           { bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.25)", color: MUTED,   icon: "✅" },
    ONGOING:             { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🔄" },
    REGISTRATION_OPEN:   { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  color: SUCCESS, icon: "🔓" },
    REGISTRATION_CLOSED: { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  color: WARNING, icon: "🔒" },
    CANCELLED:           { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.28)", color: DANGER,  icon: "🚫" },
  };
  const key = status?.toUpperCase() || "PUBLISHED";
  const s   = MAP[key] || MAP["PUBLISHED"];
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px", fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      {s.icon} {key.replace(/_/g, " ")}
    </span>
  );
}

// ─── Info Cell ────────────────────────────────────────
function InfoCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`,
      borderRadius: "8px", padding: "10px 14px",
    }}>
      <div style={{ color: MUTED, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: TEXT, fontWeight: 600, fontSize: "0.85rem" }}>{value || "—"}</div>
    </div>
  );
}

// ─── Sport Card ───────────────────────────────────────
function SportCard({
  sport, index, eventId, navigate,
}: {
  sport: EventSportResponse; index: number; eventId: string; navigate: (p: string) => void;
}) {
  const spotsLeft = sport.maxTeams - sport.registeredTeamsCount;
  const isFull    = spotsLeft <= 0;
  const hue       = (index * 47 + 11) % 360;

  return (
    <div
      onClick={() => navigate(`/events/${eventId}/sports/${sport.id}`)}
      style={{
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px",
        overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
        position: "relative",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(250,71,21,0.38)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 30px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* top stripe */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${ACCENT}, hsl(${hue},80%,55%))` }} />
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* name row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              background: "rgba(250,71,21,0.13)", border: "1px solid rgba(250,71,21,0.28)",
              color: ACCENT, borderRadius: "6px", fontSize: "0.62rem", fontWeight: 800, padding: "2px 7px",
            }}>#{index + 1}</span>
            <span style={{ fontWeight: 700, fontSize: "0.92rem", color: TEXT }}>{toLabel(sport.sport)}</span>
          </div>
          <StatusPill status={sport.status} />
        </div>

        {/* meta chips */}
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {sport.ageGroup    && <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>{toLabel(sport.ageGroup)}</span>}
          {sport.weightClass && <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>{toLabel(sport.weightClass)}</span>}
          {sport.formatType  && <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>{toLabel(sport.formatType)}</span>}
        </div>

        {/* stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ color: MUTED, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "3px" }}>Teams</div>
            <div style={{ color: WARNING, fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Orbitron', sans-serif" }}>{sport.registeredTeamsCount}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ color: MUTED, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "3px" }}>Slots</div>
            <div style={{ color: isFull ? DANGER : SUCCESS, fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Orbitron', sans-serif" }}>{isFull ? "Full" : spotsLeft}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ color: MUTED, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "3px" }}>Entry</div>
            <div style={{ color: sport.entryFee > 0 ? WARNING : SUCCESS, fontWeight: 700, fontSize: "0.82rem" }}>{sport.entryFee > 0 ? `₹${sport.entryFee}` : "Free"}</div>
          </div>
        </div>

        {/* prize + reg dates */}
        {(sport.prizeMoney > 0 || sport.registrationEndDate) && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {sport.prizeMoney > 0 && (
              <span style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", color: SUCCESS, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px", fontWeight: 600 }}>
                🏆 ₹{sport.prizeMoney.toLocaleString("en-IN")} Prize
              </span>
            )}
            {sport.registrationEndDate && (
              <span style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>
                📅 Reg ends {new Date(sport.registrationEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        )}

        {/* view button */}
        <div style={{
          background: "rgba(250,71,21,0.07)", border: "1px solid rgba(250,71,21,0.18)",
          color: ACCENT, borderRadius: "8px", padding: "8px 12px",
          fontSize: "0.78rem", fontWeight: 700, textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>View Details</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function UserEventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate    = useNavigate();

  // ── useEvent hook — single source of truth ──────────
  const {
    events,
    eventSports,
    loading,
    error,
    fetchLiveEvents,
    fetchEventSports,
    clearError,
  } = useEvent();
  // ── Real-time: auto-update event info + sports without refresh ──
  useEventRealtime(eventId)

  // ── On mount: ensure events list loaded, then load sports ──
  useEffect(() => {
    if (!eventId) return;

    const load = async () => {
      // If events not yet in store, fetch them so we can look up the current event
      if (events.length === 0) {
        await fetchLiveEvents();
      }
      await fetchEventSports(eventId);
    };

    load();
  }, [eventId, events.length, fetchEventSports, fetchLiveEvents]);

  // ── Derive current event from the shared events list ──
  const event: EventResponse | undefined = events.find(e => e.id === eventId);

  // ── Loading state ────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", color: MUTED }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Spinner size={40} />
        <div style={{ fontSize: "0.9rem" }}>Loading event…</div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "12px", padding: "20px 28px", color: DANGER, fontSize: "0.85rem", fontWeight: 600, maxWidth: "400px", textAlign: "center" }}>
          ⚠️ {error}
          <br />
          <button
            onClick={() => { clearError(); navigate("/browse-events"); }}
            style={{ marginTop: "12px", background: ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}
          >← Back to Events</button>
        </div>
      </div>
    );
  }

  // ── Event not found ──────────────────────────────────
  if (!event) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "12px", padding: "20px 28px", color: DANGER, fontSize: "0.85rem", fontWeight: 600, maxWidth: "400px", textAlign: "center" }}>
          ⚠️ Event not found.
          <br />
          <button onClick={() => navigate("/browse-events")} style={{ marginTop: "12px", background: ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>← Back to Events</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, padding: "40px 48px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2}, transparent)` }} />
      <div style={{ position: "absolute", top: "-120px", right: "-120px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(250,71,21,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto" }}>

        {/* BACK */}
        <button
          onClick={() => navigate("/browse-events")}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "8px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", marginBottom: "28px" }}
        >
          ← Back to Events
        </button>

        {/* HEADER */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>

            {/* Logo */}
            <div style={{
              width: "72px", height: "72px", borderRadius: "14px", flexShrink: 0,
              background: event.eventLogoUrl
                ? `url(${event.eventLogoUrl}) center/cover no-repeat`
                : `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              {!event.eventLogoUrl && "🏆"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{ width: "4px", height: "34px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", boxShadow: "0 0 10px rgba(250,71,21,0.5)", flexShrink: 0 }} />
                <h1 style={{ margin: 0, fontSize: "1.85rem", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
                  {event.eventName}
                </h1>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginLeft: "12px", marginTop: "6px" }}>
                <StatusPill status={event.status} />
                <span style={{ color: MUTED, fontSize: "0.75rem" }}>{event.eventCode}</span>
                {event.organizationName && (
                  <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>
                    🏛 {event.organizationName}
                  </span>
                )}
              </div>

              {event.eventDescription && (
                <p style={{ marginTop: "14px", marginLeft: "12px", color: MUTED, fontSize: "0.88rem", lineHeight: 1.7, maxWidth: "680px" }}>
                  {event.eventDescription}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* EVENT DETAILS */}
        <div style={{ background: CARD2, border: "1px solid rgba(250,71,21,0.14)", borderRadius: "16px", overflow: "hidden", marginBottom: "28px" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: ACCENT }}>📋</span> EVENT DETAILS
          </div>
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
              <InfoCell label="Status"       value={toLabel(event.status)} />
              <InfoCell label="Organization" value={event.organizationName} />
              <InfoCell label="Venue"        value={event.venueName} />
              <InfoCell label="City"         value={event.city} />
              <InfoCell label="State"        value={event.state} />
              <InfoCell label="Country"      value={event.country} />
              <InfoCell label="Start Date"   value={fmtDate(event.startDate)} />
              <InfoCell label="End Date"     value={fmtDate(event.endDate)} />
            </div>
          </div>
        </div>

        {/* SPORTS */}
        <div style={{ background: CARD2, border: "1px solid rgba(250,71,21,0.14)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.85rem" }}>SPORTS</span>
            <span style={{
              background: "rgba(250,71,21,0.13)", border: "1px solid rgba(250,71,21,0.28)",
              color: ACCENT, borderRadius: "999px", fontSize: "0.65rem", fontWeight: 800, padding: "1px 9px",
            }}>{eventSports.length}</span>
          </div>

          <div style={{ padding: "18px 20px" }}>
            {eventSports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ fontSize: "2.5rem" }}>🏅</div>
                <div style={{ color: MUTED, fontSize: "0.85rem", fontWeight: 600 }}>No sports listed for this event yet</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px", animation: "fadeIn 0.3s ease" }}>
                {eventSports.map((sport, i) => (
                  <SportCard
                    key={sport.id}
                    sport={sport}
                    index={i}
                    eventId={eventId!}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}