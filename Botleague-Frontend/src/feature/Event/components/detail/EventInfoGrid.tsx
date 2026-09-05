import { CalendarDays, MapPin, Building2, Layers } from "lucide-react";
import type { ComponentType } from "react";
import type { EventResponse } from "../../api/event.api";
import { viewOnMapHref } from "../../../../shared/utils/maps";

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
 * "View on map" reuses the exact same bordered "sport-stat" card styling
 * (border, icon, font) as the grid above, centered directly beneath it with
 * no extra vertical gap, when the event has a saved Google Maps link or
 * enough of an address to build one.
 */
export default function EventInfoGrid({ event, sportsCount }: EventInfoGridProps) {
  const items: InfoItem[] = [
    { icon: CalendarDays, label: "Date", value: dateRange(event.startDate, event.endDate) },
    { icon: MapPin, label: "Venue", value: venueLabel(event) },
    { icon: Building2, label: "Organiser", value: event.organizationName || "—" },
    { icon: Layers, label: "Techsports Offered", value: sportsCount > 0 ? `${sportsCount} techsport${sportsCount !== 1 ? "s" : ""}` : "—" },
  ];

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

      {view && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "10px" }}>
          <a
            href={view}
            target="_blank"
            rel="noopener noreferrer"
            className="sport-stat"
            style={{ textDecoration: "none", color: "#0162D1" }}
          >
            <MapPin size={20} />
            <div>
              <div
                className="sport-stat-value"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#111111",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                View on map
              </div>
            </div>
          </a>
        </div>
      )}
    </section>
  );
}