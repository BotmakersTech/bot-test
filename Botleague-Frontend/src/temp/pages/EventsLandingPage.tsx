import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, Calendar, MapPin } from "lucide-react";

import { getLiveEvents, getCompletedEvents, type EventResponse } from "../../feature/Event/api/event.api";
import droneDecor from "../../assets/Auth/drone.svg";
import "../../styles/eventsLanding.css";

const INITIAL_FEATURED = 6;
const INITIAL_PREVIOUS = 3;

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

function EventCard({ event, completed, onClick }: { event: EventResponse; completed?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="event-card" onClick={onClick}>
      <div className="event-card-image">
        {event.eventLogoUrl ? (
          <img src={event.eventLogoUrl} alt={event.eventName} />
        ) : (
          <div className="event-card-image-fallback">{event.eventName.charAt(0).toUpperCase()}</div>
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
      </div>
    </button>
  );
}

export default function EventsLandingPage() {
  const navigate = useNavigate();
  const featuredRef = useRef<HTMLDivElement>(null);

  const [featured, setFeatured] = useState<EventResponse[]>([]);
  const [previous, setPrevious] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllFeatured, setShowAllFeatured] = useState(false);
  const [showAllPrevious, setShowAllPrevious] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getLiveEvents(), getCompletedEvents()])
      .then(([live, completed]) => {
        if (cancelled) return;
        setFeatured(live);
        setPrevious(completed);
      })
      .catch(() => { /* leave lists empty — empty states below handle it */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visibleFeatured = showAllFeatured ? featured : featured.slice(0, INITIAL_FEATURED);
  const visiblePrevious = showAllPrevious ? previous : previous.slice(0, INITIAL_PREVIOUS);

  const goToEvent = (eventId: string) => navigate(`/events/${eventId}`);

  return (
    <div className="events-landing">
      <section className="events-hero">
        <nav className="events-hero-nav">
          <a href="/" className="events-hero-logo">BOT <span>LEAGUE</span></a>
          <div className="events-hero-links">
            <a href="/">Home</a>
            <a href="/events" className="active">Events</a>
            <a href="/about-us">About Us</a>
            <a href="/contact-us">Contact Us</a>
          </div>
        </nav>

        <div className="events-hero-content">
          <span className="events-hero-eyebrow">Events</span>
          <h1 className="events-hero-title">Innovate. Compete. Elevate.</h1>
          <p className="events-hero-subtitle">
            Join innovators, developers and tech leaders at BotLeague&apos;s flagship event.
          </p>
          <button
            type="button"
            className="events-hero-explore"
            onClick={() => featuredRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="events-hero-explore-circle"><ArrowDown size={22} /></span>
            <span>Explore</span>
          </button>
        </div>
      </section>

      <div className="events-content">
        <section className="events-section" ref={featuredRef}>
          <div className="events-section-header">
            <span className="events-section-eyebrow">Upcoming Events</span>
            <h2 className="events-section-title">Featured Events</h2>
          </div>

          <div className="events-grid">
            {loading ? (
              <div className="events-empty">Loading events…</div>
            ) : visibleFeatured.length === 0 ? (
              <div className="events-empty">No upcoming events right now — check back soon.</div>
            ) : (
              visibleFeatured.map((event) => (
                <EventCard key={event.id} event={event} onClick={() => goToEvent(event.id)} />
              ))
            )}
          </div>

          {!showAllFeatured && featured.length > INITIAL_FEATURED && (
            <div className="events-see-more">
              <button type="button" onClick={() => setShowAllFeatured(true)}>See More Event →</button>
            </div>
          )}
        </section>

        <section className="events-section">
          <div className="events-section-header">
            <span className="events-section-eyebrow">Look Back</span>
            <h2 className="events-section-title">Previous Events</h2>
          </div>

          <div className="events-grid">
            {loading ? (
              <div className="events-empty">Loading events…</div>
            ) : visiblePrevious.length === 0 ? (
              <div className="events-empty">No past events to show yet.</div>
            ) : (
              visiblePrevious.map((event) => (
                <EventCard key={event.id} event={event} completed onClick={() => goToEvent(event.id)} />
              ))
            )}
          </div>

          {!showAllPrevious && previous.length > INITIAL_PREVIOUS && (
            <div className="events-see-more">
              <button type="button" onClick={() => setShowAllPrevious(true)}>See More Previous →</button>
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
