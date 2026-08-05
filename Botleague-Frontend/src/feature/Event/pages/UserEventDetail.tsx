// ======================================================
// UserEventDetail.tsx
// Public Event Detail Page — Route: /events/:eventId
// Uses: useEvent hook → fetchLiveEvents() + fetchEventSports()
// ======================================================

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useEvent } from "../hook/useEvent";
import { useEventRealtime } from "../../../shared/realtime/useEventRealtime";
import Hero from "../components/detail/Hero";
import Overview from "../components/detail/Overview";
import SportsSection from "../components/detail/SportsSection";
import VolunteerCTA from "../components/detail/VolunteerCTA";
import "../../../styles/eventDetail.css";

export default function UserEventDetail() {
  const { eventId } = useParams<{ eventId: string }>();

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

  if (loading && !event) {
    return (
      <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#666" }}>
        Loading event…
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#dc2626" }}>
        {error}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#666" }}>
        Event not found.
      </div>
    );
  }

  return (
    <div className="evd-page">
      <Hero title={event.eventName} />
      <Overview description={event.eventDescription} />
      <VolunteerCTA eventId={event.id} eventName={event.eventName} volunteersNeeded={event.volunteersNeeded} />
      <SportsSection eventId={event.id} eventSports={eventSports} />
    </div>
  );
}
