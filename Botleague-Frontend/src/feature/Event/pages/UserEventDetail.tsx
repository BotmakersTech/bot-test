// ======================================================
// UserEventDetail.tsx
// Public Event Detail Page — Route: /events/:eventId
// Uses: useEvent hook → fetchLiveEvents() + fetchEventSports()
// ======================================================

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "../hook/useEvent";
import { useEventRealtime } from "../../../shared/realtime/useEventRealtime";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import Hero from "../components/detail/Hero";
import Overview from "../components/detail/Overview";
import EventInfoGrid from "../components/detail/EventInfoGrid";
import SportsSection from "../components/detail/SportsSection";
import VolunteerCTA from "../components/detail/VolunteerCTA";
import "../../../styles/eventDetail.css";

export default function UserEventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const { events, eventSports, loading, error, fetchLiveEvents, fetchEventSports } = useEvent();

  useEventRealtime(eventId);

  useEffect(() => {
    if (!eventId) return;

    const load = async () => {
      if (events.length === 0) {
        await fetchLiveEvents();
      }
      await fetchEventSports(eventId);
    };

    load();
  }, [eventId, events.length, fetchEventSports, fetchLiveEvents]);

  const event = events.find((e) => e.id === eventId);

  // Public, shareable page — the browser tab and any link-preview card
  // should name the event, not just the app.
  useEffect(() => {
    if (!event?.eventName) return;
    document.title = `${event.eventName} · BotLeague`;
    return () => { document.title = "BotLeague"; };
  }, [event?.eventName]);

  let body: React.ReactNode;
  if (loading && !event) {
    body = (
      <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#666" }}>
        Loading event…
      </div>
    );
  } else if (error && !event) {
    body = (
      <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#dc2626" }}>
        {error}
      </div>
    );
  } else if (!event) {
    body = (
      <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#666" }}>
        Event not found.
      </div>
    );
  } else {
    body = (
      <div className="evd-page">
        <Hero
          title={event.eventName}
          imageUrl={event.eventThumbnailUrl}
          videoUrl={event.teaserVideo1Url}
          backLabel="Techfests"
          onBack={() => navigate("/events")}
        />
        <Overview description={event.eventDescription} />
        <EventInfoGrid event={event} sportsCount={eventSports.length} />
        <VolunteerCTA eventId={event.id} eventName={event.eventName} volunteersNeeded={event.volunteersNeeded} />
        <SportsSection eventId={event.id} eventSports={eventSports} />
      </div>
    );
  }

  return (
    <>
      <PublicNavbar showLeagues />
      {body}
    </>
  );
}
