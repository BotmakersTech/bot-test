import { useNavigate } from "react-router-dom";
import type { EventSportResponse } from "../../api/event.api";
import EventCard from "./EventCard";
import star from "../../../../assets/Auth/Star-two.svg";
import { formatWeightClass } from "../../../Robots/constants/weightClasses";

interface SportsSectionProps {
  eventId: string;
  eventSports: EventSportResponse[];
}

function titleCase(val?: string | null): string {
  if (!val) return "";
  return val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// Same weight formatting SportDetailsHeader uses for its own "Weight" spec
// badge — kept consistent so a card's title and its own detail page agree.
// "OPEN" is a real weightClass value in the sport catalogue (sports with no
// weight subdivisions, e.g. Drone Racing) — not a meaningful class to call
// out on the card, so it's treated the same as no class at all.
function weightLabel(sport: EventSportResponse): string {
  if (sport.weightLimitKg != null) return `${sport.weightLimitKg} KG`;
  const cls = formatWeightClass(sport.weightClass);
  return cls.toUpperCase() === "OPEN" ? "" : cls;
}

export default function SportsSection({ eventId, eventSports }: SportsSectionProps) {
  const navigate = useNavigate();

  if (eventSports.length === 0) {
    return (
      <section className="sports" style={{ "--star": `url(${star})` } as React.CSSProperties}>
        <h2>SPORTS</h2>
        <p className="sports-empty">
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
            category={weightLabel(sport)}
            eligibleLeague={titleCase(sport.ageGroup)}
            description={sport.sportsDescription}
            onExplore={() => navigate(`/events/${eventId}/sports/${sport.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
