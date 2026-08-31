import { CalendarDays, MapPin, Building2, Layers, Navigation } from "lucide-react";
import type { ComponentType } from "react";
import type { EventResponse } from "../../api/event.api";
import { directionsHref, viewOnMapHref } from "../../../../shared/utils/maps";

interface EventInfoGridProps {
  event: EventResponse;
  sportsCount: number;
}

interface InfoItem {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function dateRange(start?: string, end?: string): string {
  if (!start && !end) return "—";
  if (!end || start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function venueLabel(event: EventResponse): string {
  const parts = [event.venueName, event.city, event.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

/**
 * Always exactly 4 facts, same order, every time — same "—" placeholder
 * philosophy as SportDetailsHeader's sport-stats: a card that silently
 * disappears when data is missing reads as broken, a placeholder reads as
 * "not set yet" and keeps the 2x2 grid stable.
 *
 * When the event has a location (a saved Google Maps link, or enough of an
 * address to build one) a directions link + a "view on map" link are shown
 * under the grid.
 */
export default function EventInfoGrid({ event, sportsCount }: EventInfoGridProps) {
  const items: InfoItem[] = [
    { icon: CalendarDays, label: "Date", value: dateRange(event.startDate, event.endDate) },
    { icon: MapPin, label: "Venue", value: venueLabel(event) },
    { icon: Building2, label: "Organiser", value: event.organizationName || "—" },
    { icon: Layers, label: "Techsports Offered", value: sportsCount > 0 ? `${sportsCount} techsport${sportsCount !== 1 ? "s" : ""}` : "—" },
  ];

  const dir = directionsHref({ mapUrl: event.mapUrl, venueName: event.venueName, city: event.city, state: event.state, country: event.country });
  const view = event.mapUrl || viewOnMapHref({ mapUrl: event.mapUrl, venueName: event.venueName, city: event.city, state: event.state, country: event.country });

  return (
    <section className="event-facts">
      <div className="event-stats">
        {items.map((item) => (
          <div className="sport-stat" key={item.label}>
            <item.icon size={22} />
            <div>
              <div className="sport-stat-label">{item.label}</div>
              <div className="sport-stat-value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {(dir || view) && (
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16 }}>
          {dir && (
            <a
              href={dir}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0162D1", fontWeight: 700, textDecoration: "none" }}
            >
              <Navigation size={15} /> Get Directions
            </a>
          )}
          {view && view !== dir && (
            <a
              href={view}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0162D1", fontWeight: 500, textDecoration: "none" }}
            >
              <MapPin size={15} /> View on map
            </a>
          )}
        </div>
      )}
    </section>
  );
}
