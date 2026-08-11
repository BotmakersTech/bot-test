import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, Calendar, MapPin } from "lucide-react";

import { getLiveEvents, getCompletedEvents, type EventResponse } from "../../feature/Event/api/event.api";
import droneDecor from "../../assets/Auth/drone.svg";
import PublicNavbar from "../../shared/components/PublicNavbar";
import "../../styles/eventsLanding.css";

const INITIAL_UPCOMING = 6;
const INITIAL_FEATURED = 3;

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "Date TBA";
  const start = new Date(startDate);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const startLabel = start.toLocaleDateString("en-IN", opts);
  if (!endDate || endDate === startDate) return startLabel;
  const end = new Date(endDate);
  return `${startLabel} – ${end.toLocaleDateString("en-IN", opts)}`;
}

function locationLabel(event: EventResponse): string | null {
  const parts = [event.city, event.state].filter(Boolean);
  return parts.length ? parts.join(", ") : event.venueName ?? null;
}

/** Branded gradient placeholder for events with no uploaded thumbnail/logo — not a plain initial box. */
function EventThumbnailFallback() {
  return (
    <div className="event-card-image-fallback">
      <Calendar size={40} strokeWidth={1.5} />
    </div>
  );
}

function EventCard({ event, completed, onClick }: { event: EventResponse; completed?: boolean; onClick: () => void }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className="event-card" role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKeyDown}>
      <div className="event-card-image">
        {event.eventThumbnailUrl || event.eventLogoUrl ? (
          <img src={event.eventThumbnailUrl ?? event.eventLogoUrl} alt={event.eventName} />
        ) : (
          <EventThumbnailFallback />
        )}
        <span className={completed ? "event-card-badge completed" : "event-card-badge"}>
          {completed ? "Completed" : event.status === "LIVE" ? "Live" : "Upcoming"}
        </span>
      </div>
      <div className="event-card-body">
        <h3 className="event-card-name">{event.eventName}</h3>
        <div className="event-card-meta">
          <div className="event-card-meta-row">
            <Calendar size={13} />
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>
          {locationLabel(event) && (
            <div className="event-card-meta-row">
              <MapPin size={13} />
              <span>{locationLabel(event)}</span>
            </div>
          )}
        </div>
        <span className="event-card-view-details">
          View Details <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}

export default function EventsLandingPage() {
  const navigate = useNavigate();
  const upcomingRef = useRef<HTMLDivElement>(null);

  const [upcoming, setUpcoming] = useState<EventResponse[]>([]);
  const [featured, setFeatured] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllFeatured, setShowAllFeatured] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Promise.allSettled, not Promise.all — a failure in one call (e.g. the
    // completed-events endpoint erroring) must not blank out the other's
    // real results. Promise.all rejects as soon as either call rejects, and
    // the previous empty catch() silently left BOTH lists empty even when
    // one endpoint had real data — that was the actual bug behind "published
    // events exist but don't show".
    Promise.allSettled([getLiveEvents(), getCompletedEvents()])
      .then(([liveResult, completedResult]) => {
        if (cancelled) return;
        if (liveResult.status === "fulfilled") {
          setUpcoming(liveResult.value);
        } else {
          console.error("Failed to load live/upcoming events:", liveResult.reason);
        }
        if (completedResult.status === "fulfilled") {
          setFeatured(completedResult.value);
        } else {
          console.error("Failed to load completed events:", completedResult.reason);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, INITIAL_UPCOMING);
  const visibleFeatured = showAllFeatured ? featured : featured.slice(0, INITIAL_FEATURED);

  const goToEvent = (eventId: string) => navigate(`/events/${eventId}`);

  return (
    <div className="events-landing">
      <section className="events-hero">
        <PublicNavbar showLeagues />

        <div className="events-hero-content">
          <span className="events-hero-eyebrow">Events</span>
          <h1 className="events-hero-title">Innovate. Compete. Elevate.</h1>
          <p className="events-hero-subtitle">
            Join innovators, developers and tech leaders at BotLeague&apos;s flagship event.
          </p>
          <button
            type="button"
            className="events-hero-explore"
            onClick={() => upcomingRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="events-hero-explore-circle"><ArrowDown size={22} /></span>
            <span>Explore</span>
          </button>
        </div>
      </section>

      <div className="events-content">
        <section className="events-section" ref={upcomingRef}>
          <div className="events-section-header">
            <span className="events-section-eyebrow">Don&apos;t Miss Out</span>
            <h2 className="events-section-title">Upcoming Events</h2>
          </div>

          <div className="events-grid">
            {loading ? (
              <div className="events-empty">Loading events…</div>
            ) : visibleUpcoming.length === 0 ? (
              <div className="events-empty">No upcoming events right now — check back soon.</div>
            ) : (
              visibleUpcoming.map((event) => (
                <EventCard key={event.id} event={event} onClick={() => goToEvent(event.id)} />
              ))
            )}
          </div>

          {!showAllUpcoming && upcoming.length > INITIAL_UPCOMING && (
            <div className="events-see-more">
              <button type="button" onClick={() => setShowAllUpcoming(true)}>See More Events →</button>
            </div>
          )}
        </section>

        <section className="events-section">
          <div className="events-section-header">
            <span className="events-section-eyebrow">Look Back</span>
            <h2 className="events-section-title">Featured Events</h2>
          </div>

          <div className="events-grid">
            {loading ? (
              <div className="events-empty">Loading events…</div>
            ) : visibleFeatured.length === 0 ? (
              <div className="events-empty">No past events to show yet.</div>
            ) : (
              visibleFeatured.map((event) => (
                <EventCard key={event.id} event={event} completed onClick={() => goToEvent(event.id)} />
              ))
            )}
          </div>

          {!showAllFeatured && featured.length > INITIAL_FEATURED && (
            <div className="events-see-more">
              <button type="button" onClick={() => setShowAllFeatured(true)}>See More Featured →</button>
            </div>
          )}
        </section>

        <section className="events-about">
          <img src={droneDecor} alt="" className="events-about-decor" aria-hidden="true" />
          <h2 className="events-about-title">About the Event</h2>
          <p className="events-about-text">
            Bot League events bring together bright minds from around the world to build, learn and grow.
            Engage in insightful sessions, exciting competitions, and networking opportunities.
          </p>
        </section>
      </div>
    </div>
  );
}
