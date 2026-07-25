import { useNavigate } from "react-router-dom";
import type { EventSportResponse } from "../../api/event.api";
import EventCard from "./EventCard";
import star from "../../../../assets/Auth/Star-two.svg";

interface SportsSectionProps {
  eventId: string;
  eventSports: EventSportResponse[];
}

export default function SportsSection({ eventId, eventSports }: SportsSectionProps) {
  const navigate = useNavigate();

  if (eventSports.length === 0) {
    return (
      <section className="sports" style={{ "--star": `url(${star})` } as React.CSSProperties}>
        <h2>SPORTS</h2>
        <p style={{ position: "relative", zIndex: 2, textAlign: "center", color: "#fff", opacity: 0.85 }}>
          Sports for this event haven't been published yet — check back soon.
        </p>
      </section>
    );
  }

  return (
    <section className="sports" style={{ "--star": `url(${star})` } as React.CSSProperties}>
      <img src={star} className="sports-star star-1" alt="" />
      <img src={star} className="sports-star star-2" alt="" />

      <h2>SPORTS</h2>

      <div className="cards">
        {eventSports.map((sport) => (
          <EventCard
            key={sport.id}
            image={sport.sportThumbnailUrl}
            title={sport.sport?.replace(/_/g, " ") ?? "Sport"}
            description={sport.sportsDescription}
            onExplore={() => navigate(`/events/${eventId}/sports/${sport.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
