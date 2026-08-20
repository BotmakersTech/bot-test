import { CalendarDays, MapPin, Building2, Layers } from "lucide-react";
import type { ComponentType } from "react";
import type { EventResponse } from "../../api/event.api";

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
 */
export default function EventInfoGrid({ event, sportsCount }: EventInfoGridProps) {
  const items: InfoItem[] = [
    { icon: CalendarDays, label: "Date", value: dateRange(event.startDate, event.endDate) },
    { icon: MapPin, label: "Venue", value: venueLabel(event) },
    { icon: Building2, label: "Organiser", value: event.organizationName || "—" },
    { icon: Layers, label: "Sports Offered", value: sportsCount > 0 ? `${sportsCount} sport${sportsCount !== 1 ? "s" : ""}` : "—" },
  ];

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
    </section>
  );
}
