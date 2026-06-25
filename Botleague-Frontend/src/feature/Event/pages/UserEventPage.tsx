// ======================================================
// UserEventPage.tsx
// Public-facing Events List (with filters)
// Route: /events
// Uses: useEvent hook → fetchLiveEvents()
// ======================================================

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvent } from "../hook/useEvent";
import type { EventResponse } from "../api/event.api";

// ─── Design Tokens ────────────────────────────────────
const BG     = "#3a3a3a";
const CARD   = "rgba(0,0,0,0.25)";
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
function fmtDate(val?: string | null): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
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

// ─── Status config ────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; dot: string }> = {
  PUBLISHED:           { color: ACCENT,  bg: "rgba(250,71,21,0.11)",  border: "rgba(250,71,21,0.28)",   label: "Published",           dot: ACCENT  },
  LIVE:                { color: SUCCESS, bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  label: "Live",                dot: SUCCESS },
  ONGOING:             { color: SUCCESS, bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  label: "Ongoing",             dot: SUCCESS },
  COMPLETED:           { color: MUTED,   bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.25)", label: "Completed",           dot: MUTED   },
  REGISTRATION_OPEN:   { color: SUCCESS, bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.28)",  label: "Registration Open",   dot: SUCCESS },
  REGISTRATION_CLOSED: { color: WARNING, bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.28)",  label: "Registration Closed", dot: WARNING },
  CANCELLED:           { color: DANGER,  bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.28)", label: "Cancelled",           dot: DANGER  },
};

const STATUS_LIST = Object.keys(STATUS_CONFIG);

function StatusPill({ status }: { status?: string }) {
  const key = status?.toUpperCase() || "PUBLISHED";
  const s   = STATUS_CONFIG[key] || STATUS_CONFIG["PUBLISHED"];
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      borderRadius: "999px", fontSize: "0.67rem", padding: "3px 10px",
      fontWeight: 700, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "5px",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

// ─── Event Card ───────────────────────────────────────
function EventCard({ event, onClick }: { event: EventResponse; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px",
        padding: "20px 24px", cursor: "pointer", transition: "all 0.2s ease",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = "1px solid rgba(250,71,21,0.3)";
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 12px 30px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.border = `1px solid ${BORDER}`;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
      }}
    >
      {/* left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
        background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`,
        borderRadius: "14px 0 0 14px",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        {/* left side */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "10px", flexShrink: 0,
              background: event.eventLogoUrl
                ? `url(${event.eventLogoUrl}) center/cover no-repeat`
                : `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}>
              {!event.eventLogoUrl && "🏆"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: TEXT }}>{event.eventName}</h3>
                <StatusPill status={event.status} />
              </div>
              <div style={{ color: MUTED, fontSize: "0.73rem" }}>{event.eventCode}</div>
            </div>
          </div>

          {event.eventDescription && (
            <p style={{ margin: "0 0 12px", color: MUTED, fontSize: "0.82rem", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {event.eventDescription}
            </p>
          )}

          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
            {event.venueName && (
              <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>
                📍 {event.venueName}
              </span>
            )}
            {(event.city || event.state) && (
              <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>
                🌆 {[event.city, event.state].filter(Boolean).join(", ")}
              </span>
            )}
            {event.startDate && (
              <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>
                📅 {fmtDate(event.startDate)}{event.endDate && ` → ${fmtDate(event.endDate)}`}
              </span>
            )}
            {event.organizationName && (
              <span style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", fontSize: "0.7rem", padding: "3px 9px" }}>
                🏛 {event.organizationName}
              </span>
            )}
          </div>
        </div>

        {/* right — view button */}
        <button
          onClick={e => { e.stopPropagation(); onClick(); }}
          style={{
            background: "rgba(250,71,21,0.1)", border: "1px solid rgba(250,71,21,0.22)",
            color: ACCENT, borderRadius: "8px", padding: "9px 18px",
            fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s", whiteSpace: "nowrap", alignSelf: "center",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(250,71,21,0.2)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(250,71,21,0.1)"}
        >
          View Event →
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function UserEventPage() {
  const navigate = useNavigate();

  // ── useEvent hook — single source of truth ──────────
  const {
    events,
    loading,
    error,
    fetchLiveEvents,
    clearError,
  } = useEvent();

  // ── Local UI state ───────────────────────────────────
  const [search,          setSearch]          = useState("");
  const [searchFocused,   setSearchFocused]   = useState(false);
  const [showDropdown,    setShowDropdown]    = useState(false);
  const [selectedStatus,  setSelectedStatus]  = useState("");
  const [selectedCity,    setSelectedCity]    = useState("");
  const [appliedFilters,  setAppliedFilters]  = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Fetch live events on mount ───────────────────────
  useEffect(() => {
    fetchLiveEvents();
  }, [fetchLiveEvents]);

  // ── Close dropdown on outside click ─────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Derived data ─────────────────────────────────────
  const cities = Array.from(new Set(events.map(e => e.city).filter(Boolean))) as string[];

  const filtered = appliedFilters
    ? events.filter(e => {
        const matchSearch = !search ||
          e.eventName?.toLowerCase().includes(search.toLowerCase()) ||
          e.eventCode?.toLowerCase().includes(search.toLowerCase()) ||
          e.city?.toLowerCase().includes(search.toLowerCase()) ||
          e.organizationName?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !selectedStatus || e.status === selectedStatus;
        const matchCity   = !selectedCity   || e.city   === selectedCity;
        return matchSearch && matchStatus && matchCity;
      })
    : [];

  const dropdownResults = events.filter(e =>
    search && (
      e.eventName?.toLowerCase().includes(search.toLowerCase()) ||
      e.eventCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.city?.toLowerCase().includes(search.toLowerCase())
    )
  ).slice(0, 6);

  const activeFilters = [selectedStatus, selectedCity].filter(Boolean).length;

  const handleRetry = () => {
    clearError();
    fetchLiveEvents();
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, width: "100%", padding: "40px 48px", position: "relative", overflow: "hidden", color: TEXT }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #2a2a2a; color: #fff; }
      `}</style>

      {/* decorations */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(to right, ${ACCENT}, ${ACCENT2}, transparent)` }} />
      <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "450px", height: "450px", borderRadius: "50%", background: `radial-gradient(circle, rgba(250,71,21,0.06) 0%, transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "4px", height: "34px", background: `linear-gradient(to bottom, ${ACCENT}, ${ACCENT2})`, borderRadius: "2px", boxShadow: "0 0 10px rgba(250,71,21,0.6)" }} />
            <h1 style={{ margin: 0, fontSize: "1.9rem", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.1em" }}>FIND EVENTS</h1>
          </div>
          <p style={{ margin: "0 0 0 16px", color: MUTED, fontSize: "0.85rem" }}>
            Discover and explore competitive robotics events
          </p>
        </div>

        {/* SEARCH BAR */}
        <div ref={dropdownRef} style={{ position: "relative", marginBottom: "24px" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: searchFocused ? "rgba(0,0,0,0.45)" : CARD,
            border: searchFocused ? `1px solid ${ACCENT}` : `1px solid ${BORDER}`,
            borderRadius: "12px", padding: "0 18px", transition: "all 0.2s",
            boxShadow: searchFocused ? "0 0 0 3px rgba(250,71,21,0.1)" : "none",
          }}>
            <svg width="17" height="17" fill="none" stroke={MUTED} strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: "12px", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onFocus={() => { setSearchFocused(true); setShowDropdown(true); }}
              onBlur={() => setSearchFocused(false)}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              placeholder="Search events by name, city, or code…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: TEXT, fontSize: "0.92rem", padding: "15px 0" }}
            />
            {search && (
              <button onClick={() => { setSearch(""); setShowDropdown(false); }} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: MUTED, borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && search && (
            <div style={{ position: "absolute", width: "100%", top: "calc(100% + 6px)", background: "#2d2d2d", border: "1px solid rgba(250,71,21,0.18)", borderRadius: "12px", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", maxHeight: "260px", overflowY: "auto", zIndex: 50 }}>
              {dropdownResults.length > 0 ? dropdownResults.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => { setSearch(ev.eventName); setShowDropdown(false); navigate(`/events/${ev.id}`); }}
                  style={{ padding: "12px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${BORDER}`, transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(250,71,21,0.09)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1rem" }}>🏆</span>
                    <span style={{ color: TEXT, fontSize: "0.88rem", fontWeight: 600 }}>{ev.eventName}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {ev.city && <span style={{ color: MUTED, fontSize: "0.75rem" }}>{ev.city}</span>}
                    <StatusPill status={ev.status} />
                  </div>
                </div>
              )) : (
                <div style={{ padding: "18px", textAlign: "center", color: MUTED, fontSize: "0.85rem" }}>No matching events</div>
              )}
            </div>
          )}
        </div>

        {/* FILTERS */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "20px 24px", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="13" height="13" fill="none" stroke={ACCENT} strokeWidth="2.5" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: ACCENT, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif" }}>Filters</span>
              {activeFilters > 0 && <span style={{ background: ACCENT, color: "#fff", borderRadius: "999px", fontSize: "0.68rem", padding: "1px 8px", fontWeight: 700 }}>{activeFilters}</span>}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => { setSelectedStatus(""); setSelectedCity(""); setSearch(""); setAppliedFilters(true); }}
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "8px", padding: "8px 16px", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"}
              >Reset</button>
              <button
                onClick={() => setAppliedFilters(true)}
                style={{ background: `linear-gradient(135deg, #ff4d4d, ${ACCENT})`, border: "none", color: "#fff", borderRadius: "8px", padding: "8px 18px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(255,77,77,0.3)" }}
              >Apply Filters</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {/* Status filter */}
            <div style={{ flex: 1, minWidth: "160px" }}>
              <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Status</div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{ width: "100%", background: "rgba(0,0,0,0.28)", border: selectedStatus ? "1px solid rgba(250,71,21,0.5)" : `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: selectedStatus ? TEXT : "#6b7280", fontSize: "0.83rem", outline: "none", cursor: "pointer" }}
              >
                <option value="">All Statuses</option>
                {STATUS_LIST.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>

            {/* City filter */}
            <div style={{ flex: 1, minWidth: "160px" }}>
              <div style={{ fontSize: "0.67rem", color: MUTED, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>City</div>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                style={{ width: "100%", background: "rgba(0,0,0,0.28)", border: selectedCity ? "1px solid rgba(250,71,21,0.5)" : `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: selectedCity ? TEXT : "#6b7280", fontSize: "0.83rem", outline: "none", cursor: "pointer" }}
              >
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "30vh", gap: "16px", color: MUTED }}>
            <Spinner size={40} />
            <div style={{ fontSize: "0.9rem" }}>Loading events…</div>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "12px", padding: "16px 20px", color: DANGER, fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={handleRetry}
              style={{ marginLeft: "auto", background: "rgba(248,113,113,0.14)", border: "1px solid rgba(248,113,113,0.28)", color: DANGER, borderRadius: "6px", padding: "4px 12px", fontSize: "0.77rem", fontWeight: 700, cursor: "pointer" }}
            >Retry</button>
          </div>
        )}

        {/* NO RESULTS */}
        {!loading && !error && appliedFilters && filtered.length === 0 && events.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "28vh", textAlign: "center" }}>
            <svg width="48" height="48" fill="none" stroke={MUTED} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: "14px", opacity: 0.4 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h3 style={{ margin: "0 0 8px", color: LABEL, fontFamily: "'Orbitron', sans-serif", fontSize: "0.95rem" }}>NO EVENTS FOUND</h3>
            <p style={{ color: MUTED, fontSize: "0.82rem" }}>Try adjusting your filters or search query</p>
          </div>
        )}

        {/* EMPTY — no events at all */}
        {!loading && !error && events.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "32vh", textAlign: "center" }}>
            <div style={{ width: "88px", height: "88px", borderRadius: "20px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(250,71,21,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px", fontSize: "2.5rem" }}>🏟️</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", fontFamily: "'Orbitron', sans-serif", color: LABEL, letterSpacing: "0.06em" }}>NO LIVE EVENTS</h3>
            <p style={{ color: MUTED, fontSize: "0.82rem", maxWidth: "260px" }}>Check back soon for upcoming competitions</p>
          </div>
        )}

        {/* RESULTS */}
        {!loading && !error && appliedFilters && filtered.length > 0 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", color: ACCENT, textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif" }}>Results</span>
              <span style={{ background: "rgba(250,71,21,0.14)", border: "1px solid rgba(250,71,21,0.28)", color: ACCENT, borderRadius: "999px", fontSize: "0.72rem", padding: "2px 10px", fontWeight: 700 }}>{filtered.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {filtered.map(ev => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onClick={() => navigate(`/events/${ev.id}`)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}