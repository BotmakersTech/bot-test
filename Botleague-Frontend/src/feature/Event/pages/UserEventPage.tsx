// ======================================================
// UserEventPage.tsx
// Logged-in "Browse Events" dashboard view — Route: /browse-events
// (distinct from the public marketing page at /events)
// Uses: useEvent hook → fetchLiveEvents()
// ======================================================

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, Calendar, Building2, SlidersHorizontal } from "lucide-react";
import { useEvent } from "../hook/useEvent";
import type { EventResponse } from "../api/event.api";
import "../../../styles/eventsUser.css";

// ─── Helpers ──────────────────────────────────────────
function fmtDate(val?: string | null): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PUBLISHED:           { label: "Published",           cls: "evt-status--published" },
  LIVE:                { label: "Live",                cls: "evt-status--live" },
  ONGOING:              { label: "Ongoing",             cls: "evt-status--live" },
  COMPLETED:           { label: "Completed",           cls: "evt-status--completed" },
  REGISTRATION_OPEN:   { label: "Registration Open",   cls: "evt-status--open" },
  REGISTRATION_CLOSED: { label: "Registration Closed", cls: "evt-status--closed" },
  CANCELLED:           { label: "Cancelled",           cls: "evt-status--cancelled" },
};
const STATUS_LIST = Object.keys(STATUS_META);

function StatusPill({ status }: { status?: string }) {
  const meta = STATUS_META[status?.toUpperCase() ?? ""] ?? STATUS_META.PUBLISHED;
  return (
    <span className={`evt-status ${meta.cls}`}>
      <span className="dot" />
      {meta.label}
    </span>
  );
}

// ─── Event Card ───────────────────────────────────────
function EventCard({ event, onClick }: { event: EventResponse; onClick: () => void }) {
  const location = [event.city, event.state].filter(Boolean).join(", ");
  return (
    <div className="evt-event-card flex flex-col sm:flex-row sm:items-center gap-4" onClick={onClick}>
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div
          className="evt-event-thumb"
          style={
            event.eventLogoUrl || event.eventThumbnailUrl
              ? { backgroundImage: `url(${event.eventLogoUrl ?? event.eventThumbnailUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          {!(event.eventLogoUrl || event.eventThumbnailUrl) && event.eventName.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="evt-font-poppins font-bold text-[15px] text-[#1a1a2e] truncate">{event.eventName}</h3>
            <StatusPill status={event.status} />
          </div>
          <p className="text-[11px] text-gray-400 font-medium mb-2">{event.eventCode}</p>

          {event.eventDescription && (
            <p className="text-[12.5px] text-gray-500 leading-relaxed mb-2 line-clamp-2">{event.eventDescription}</p>
          )}

          <div className="flex gap-2 flex-wrap">
            {event.venueName && (
              <span className="evt-tag"><MapPin size={11} />{event.venueName}</span>
            )}
            {location && <span className="evt-tag"><Building2 size={11} />{location}</span>}
            {event.startDate && (
              <span className="evt-tag">
                <Calendar size={11} />
                {fmtDate(event.startDate)}{event.endDate && event.endDate !== event.startDate ? ` – ${fmtDate(event.endDate)}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="evt-view-btn self-start sm:self-center"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        View Event →
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function UserEventPage() {
  const navigate = useNavigate();
  const { events, loading, error, fetchLiveEvents, clearError } = useEvent();

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLiveEvents();
  }, [fetchLiveEvents]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cities = Array.from(new Set(events.map((e) => e.city).filter(Boolean))) as string[];

  const matchesSearch = (e: EventResponse) =>
    !search ||
    e.eventName?.toLowerCase().includes(search.toLowerCase()) ||
    e.eventCode?.toLowerCase().includes(search.toLowerCase()) ||
    e.city?.toLowerCase().includes(search.toLowerCase()) ||
    e.organizationName?.toLowerCase().includes(search.toLowerCase());

  const filtered = events.filter(
    (e) => matchesSearch(e) && (!status || e.status === status) && (!city || e.city === city)
  );

  const suggestions = search ? events.filter(matchesSearch).slice(0, 6) : [];
  const activeFilters = [status, city].filter(Boolean).length;

  const applyFilters = () => { setStatus(draftStatus); setCity(draftCity); };
  const resetFilters = () => { setDraftStatus(""); setDraftCity(""); setStatus(""); setCity(""); setSearch(""); };

  const goToEvent = (id: string) => navigate(`/events/${id}`);

  return (
    <div className="evt-page min-h-screen px-5 sm:px-10 lg:px-14 py-8 lg:py-12 relative overflow-hidden">
      <svg className="evt-outline-star hidden lg:block" style={{ top: 40, right: "6%", width: 70, height: 66 }} viewBox="0 0 51 48" fill="rgba(74,132,230,0.10)"><path d="M25.5 2 L31 18.5 L48.4 18.5 L34.4 29 L39.9 45.5 L25.5 35 L11.1 45.5 L16.6 29 L2.6 18.5 L20 18.5 Z"/></svg>
      <svg className="evt-outline-star hidden lg:block" style={{ bottom: 60, left: "4%", width: 54, height: 50 }} viewBox="0 0 51 48" fill="rgba(74,132,230,0.10)"><path d="M25.5 2 L31 18.5 L48.4 18.5 L34.4 29 L39.9 45.5 L25.5 35 L11.1 45.5 L16.6 29 L2.6 18.5 L20 18.5 Z"/></svg>

      <div className="relative z-10 max-w-[1100px] mx-auto flex flex-col gap-6">
        {/* HEADER */}
        <div>
          <h1 className="evt-font-sarpanch text-[24px] sm:text-[30px] font-semibold text-[#1a1a2e]">
            Find <span className="evt-text-gradient">Events</span>
          </h1>
          <p className="evt-font-poppins text-[13px] sm:text-[14px] text-gray-500 mt-1">
            Discover and register for upcoming robot-combat tournaments.
          </p>
        </div>

        {/* SEARCH */}
        <div ref={dropdownRef} className="relative">
          <div
            className="evt-input flex items-center gap-3 h-[50px] px-4"
            style={searchFocused ? { boxShadow: "0 0 0 3px rgba(79,108,234,0.12)" } : undefined}
          >
            <Search size={17} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onFocus={() => { setSearchFocused(true); setShowDropdown(true); }}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              placeholder="Search events by name, city, or code…"
              className="flex-1 bg-transparent outline-none text-[14px] evt-font-poppins placeholder:text-gray-400"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); setShowDropdown(false); }} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={16} />
              </button>
            )}
          </div>

          {showDropdown && search && (
            <div className="evt-suggest">
              {suggestions.length > 0 ? (
                suggestions.map((ev) => (
                  <div key={ev.id} className="evt-suggest-row" onClick={() => { setShowDropdown(false); goToEvent(ev.id); }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-[13.5px] text-[#1a1a2e] truncate">{ev.eventName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ev.city && <span className="text-[11px] text-gray-400">{ev.city}</span>}
                      <StatusPill status={ev.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-4 text-center text-[13px] text-gray-400 evt-font-poppins">No matching events</div>
              )}
            </div>
          )}
        </div>

        {/* FILTERS */}
        <div className="evt-card p-5 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={13} className="text-[#4F6EF7]" />
              <span className="evt-font-poppins text-[11px] font-bold tracking-wider text-[#4F6EF7] uppercase">Filters</span>
              {activeFilters > 0 && (
                <span className="bg-[#4F6EF7] text-white text-[11px] font-bold rounded-full px-2 py-0.5">{activeFilters}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={resetFilters} className="evt-font-poppins text-[13px] font-medium text-gray-500 border border-[#E7E9F5] rounded-lg px-4 py-2 hover:bg-gray-50">
                Reset
              </button>
              <button type="button" onClick={applyFilters} className="evt-font-poppins text-[13px] font-bold text-white rounded-lg px-4 py-2" style={{ background: "linear-gradient(135deg,#0162D1,#8C6CFF)" }}>
                Apply Filters
              </button>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="evt-font-poppins block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Status</label>
              <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} className="evt-input w-full h-[42px] px-3 text-[13.5px] evt-font-poppins text-gray-700">
                <option value="">All Statuses</option>
                {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="evt-font-poppins block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">City</label>
              <select value={draftCity} onChange={(e) => setDraftCity(e.target.value)} className="evt-input w-full h-[42px] px-3 text-[13.5px] evt-font-poppins text-gray-700">
                <option value="">All Cities</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-400">
            <span className="evt-spinner" style={{ width: 34, height: 34 }} />
            <p className="evt-font-poppins text-[13.5px]">Loading events…</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <span className="text-[13px] font-semibold text-red-600 evt-font-poppins flex-1">{error}</span>
            <button
              type="button"
              onClick={() => { clearError(); fetchLiveEvents(); }}
              className="evt-font-poppins text-[12px] font-bold text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* NO RESULTS (filters too narrow) */}
        {!loading && !error && events.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Search size={38} className="text-gray-300 mb-1" />
            <h3 className="evt-font-poppins font-bold text-[14px] text-[#1a1a2e]">No events found</h3>
            <p className="evt-font-poppins text-[13px] text-gray-400">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* EMPTY (no events at all) */}
        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: "rgba(79,108,234,0.08)", border: "1px solid rgba(79,108,234,0.18)" }}>
              <Calendar size={26} className="text-[#4F6EF7]" />
            </div>
            <h3 className="evt-font-poppins font-bold text-[14px] text-[#1a1a2e]">No live events right now</h3>
            <p className="evt-font-poppins text-[13px] text-gray-400 max-w-[260px]">Check back soon for upcoming competitions.</p>
          </div>
        )}

        {/* RESULTS */}
        {!loading && !error && filtered.length > 0 && (
          <div className="evt-fade-in flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="evt-font-poppins text-[11px] font-bold tracking-wider text-[#4F6EF7] uppercase">Results</span>
              <span className="bg-[#EEF1FF] text-[#4F6EF7] text-[11px] font-bold rounded-full px-2.5 py-0.5 border border-[#DCE1FA]">{filtered.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {filtered.map((ev) => (
                <EventCard key={ev.id} event={ev} onClick={() => goToEvent(ev.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
