// ======================================================
// UserEventPage.tsx
// Logged-in "Browse Events" dashboard view — Route: /browse-events
// (distinct from the public marketing page at /events)
// Uses: useEvent hook → fetchLiveEvents()
// ======================================================

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, Calendar, Building2 } from "lucide-react";
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
// Mobile (<sm) shows a decluttered set — logo, name, venue, date, and a
// full-width View button — instead of desktop's fuller card (code,
// description, location). That fuller text block used to be much taller
// than the 52px logo next to it, leaving the row lopsided with dead space
// under the logo on narrow screens; the venue/date tags and button now get
// their own full-width rows below instead of being squeezed into the
// logo's narrow sibling column.
export function EventCard({ event, onClick }: { event: EventResponse; onClick: () => void }) {
  const location = [event.city, event.state].filter(Boolean).join(", ");
  return (
    <div className="evt-event-card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" onClick={onClick}>
      <div className="flex items-center gap-3 sm:items-start sm:gap-4 flex-1 min-w-0">
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
          <p className="hidden sm:block text-[11px] text-gray-400 font-medium mb-2">{event.eventCode}</p>

          {event.eventDescription && (
            <p className="hidden sm:block text-[12.5px] text-gray-500 leading-relaxed mb-2 line-clamp-2">{event.eventDescription}</p>
          )}

          <div className="hidden sm:flex gap-2 flex-wrap">
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

      {/* mobile-only: venue/date get the full card width instead of being
          squeezed beside the logo */}
      {(event.venueName || event.startDate) && (
        <div className="flex sm:hidden gap-2 flex-wrap">
          {event.venueName && (
            <span className="evt-tag"><MapPin size={11} />{event.venueName}</span>
          )}
          {event.startDate && (
            <span className="evt-tag">
              <Calendar size={11} />
              {fmtDate(event.startDate)}{event.endDate && event.endDate !== event.startDate ? ` – ${fmtDate(event.endDate)}` : ""}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        className="evt-view-btn w-full sm:w-auto sm:self-center"
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

  // `search` drives the live typeahead dropdown as you type; `activeSearch`
  // is what actually filters the results grid, only updated on submit
  // (button click / Enter) — same search+button commit pattern as the
  // admin list pages (Team/Robot/User/Judge Management) instead of
  // refiltering the whole grid on every keystroke.
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const matchesQuery = (e: EventResponse, q: string) =>
    !q ||
    e.eventName?.toLowerCase().includes(q.toLowerCase()) ||
    e.eventCode?.toLowerCase().includes(q.toLowerCase()) ||
    e.city?.toLowerCase().includes(q.toLowerCase()) ||
    e.organizationName?.toLowerCase().includes(q.toLowerCase());

  const filtered = events.filter((e) => matchesQuery(e, activeSearch));
  const suggestions = search ? events.filter((e) => matchesQuery(e, search)).slice(0, 6) : [];

  const submitSearch = () => {
    setActiveSearch(search);
    setShowDropdown(false);
  };

  const goToEvent = (id: string) => navigate(`/events/${id}`);

  return (
    <div className="evt-page min-h-screen p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <svg className="evt-outline-star hidden lg:block" style={{ top: 40, right: "6%", width: 70, height: 66 }} viewBox="0 0 51 48" fill="rgba(74,132,230,0.10)"><path d="M25.5 2 L31 18.5 L48.4 18.5 L34.4 29 L39.9 45.5 L25.5 35 L11.1 45.5 L16.6 29 L2.6 18.5 L20 18.5 Z"/></svg>
      <svg className="evt-outline-star hidden lg:block" style={{ bottom: 60, left: "4%", width: 54, height: 50 }} viewBox="0 0 51 48" fill="rgba(74,132,230,0.10)"><path d="M25.5 2 L31 18.5 L48.4 18.5 L34.4 29 L39.9 45.5 L25.5 35 L11.1 45.5 L16.6 29 L2.6 18.5 L20 18.5 Z"/></svg>

      <div className="relative z-10  mx-auto flex flex-col gap-6">
        {/* HEADER */}
        <div>
          <h1 className="evt-heading-mobile evt-font-sarpanch text-[24px] sm:text-[38px] font-medium text-[#1a1a2e]">
            Find <span className="evt-text-gradient">Events</span>
          </h1>
          <p className="evt-font-poppins text-[13px] sm:text-[14px] text-gray-500 mt-1">
            Discover and register for upcoming robot-combat tournaments.
          </p>
        </div>

        {/* SEARCH — input + a real submit button (Enter or click), instead
            of refiltering the grid live on every keystroke. The Filters
            card (status/city) was dropped entirely; this is the only
            control now. */}
        <div ref={dropdownRef} className="relative flex gap-2 items-stretch">
          <div className="relative flex-1 min-w-0">
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
                onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
                placeholder="Search events by name, city, or code…"
                className="flex-1 bg-transparent outline-none text-[14px] evt-font-poppins placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setActiveSearch(""); setShowDropdown(false); }}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label="Clear search"
                >
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

          <button type="button" onClick={submitSearch} className="evt-search-btn evt-font-poppins">
            Search
          </button>
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
            <h3 className="evt-heading-mobile evt-font-poppins font-bold text-[14px] text-[#1a1a2e]">No events found</h3>
            <p className="evt-font-poppins text-[13px] text-gray-400">Try adjusting your search query.</p>
          </div>
        )}

        {/* EMPTY (no events at all) */}
        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: "rgba(79,108,234,0.08)", border: "1px solid rgba(79,108,234,0.18)" }}>
              <Calendar size={26} className="text-[#4F6EF7]" />
            </div>
            <h3 className="evt-heading-mobile evt-font-poppins font-bold text-[14px] text-[#1a1a2e]">No live events right now</h3>
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
