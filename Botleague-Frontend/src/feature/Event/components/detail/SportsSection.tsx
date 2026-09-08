import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { EventSportResponse } from "../../api/event.api";
import EventCard from "./EventCard";
import star from "../../../../assets/Auth/Star-two.svg";
import { formatWeightClass } from "../../../Robots/constants/weightClasses";
import { ageGroupLabel } from "../../../../shared/utils/ageGroup";

interface SportsSectionProps {
  eventId: string;
  eventSports: EventSportResponse[];
}

// Youngest league first, the order they're shown everywhere else on the site.
const LEAGUE_ORDER = ["JUNIOR_INNOVATORS", "YOUNG_ENGINEERS", "ROBO_MINDS"];

const ALL = "ALL";

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
  const [league, setLeague] = useState<string>(ALL);

  // Tabs come from the leagues this event actually runs, not a fixed list —
  // an event with no Ignite techsports shouldn't offer an Ignite tab that
  // leads to an empty grid. Any league the catalog adds later appears here
  // on its own once an event uses it.
  const leagueTabs = useMemo(() => {
    const counts = new Map<string, number>();
    eventSports.forEach((s) => {
      const code = s.ageGroup;
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort(([a], [b]) => {
        const ia = LEAGUE_ORDER.indexOf(a);
        const ib = LEAGUE_ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map(([code, count]) => ({ code, count, label: ageGroupLabel(code) }));
  }, [eventSports]);

  const visibleSports = league === ALL
    ? eventSports
    : eventSports.filter((s) => s.ageGroup === league);

  // One league is not a filter — showing "All | Apex" over an unchanged grid
  // is just noise.
  const showTabs = leagueTabs.length > 1;

  if (eventSports.length === 0) {
    return (
      <section className="sports" style={{ "--star": `url(${star})` } as React.CSSProperties}>
        <h2>TECHSPORTS</h2>
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

      <h2>TECHSPORTS</h2>

      {showTabs && (
        <div className="sports-filter" role="tablist" aria-label="Filter techsports by league">
          <button
            type="button"
            role="tab"
            aria-selected={league === ALL}
            className={league === ALL ? "active" : ""}
            onClick={() => setLeague(ALL)}
          >
            All <span className="sports-filter-count">{eventSports.length}</span>
          </button>
          {leagueTabs.map((t) => (
            <button
              key={t.code}
              type="button"
              role="tab"
              aria-selected={league === t.code}
              className={league === t.code ? "active" : ""}
              onClick={() => setLeague(t.code)}
            >
              {t.label} <span className="sports-filter-count">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="cards">
        {visibleSports.map((sport) => (
          <EventCard
            key={sport.id}
            image={sport.sportThumbnailUrl}
            title={sport.sport?.replace(/_/g, " ") ?? "Sport"}
            category={weightLabel(sport)}
            eligibleLeague={ageGroupLabel(sport.ageGroup)}
            description={sport.sportsDescription}
            onExplore={() => navigate(`/events/${eventId}/sports/${sport.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
