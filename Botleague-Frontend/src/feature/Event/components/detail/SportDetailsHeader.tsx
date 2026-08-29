import { Users, Weight, Wallet, Trophy, GraduationCap, Layers, MapPin } from "lucide-react";
import { formatPrizePosition } from "../../../../shared/utils/prize";
import type { ComponentType } from "react";
import type { EventSportResponse, SupportContact } from "../../api/event.api";
import plane from "../../../../assets/Auth/plane.svg";
import star from "../../../../assets/Auth/Star-two.svg";
import { formatWeightClass } from "../../../Robots/constants/weightClasses";
import { ageGroupLabel } from "../../../../shared/utils/ageGroup";

interface SportDetailsHeaderProps {
  sport: EventSportResponse;
  contacts: SupportContact[];
}

function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://api.whatsapp.com/send/?phone=${digits}`;
}

function formatCurrency(val?: number | null): string {
  if (val == null) return "—";
  return `₹${val.toLocaleString("en-IN")}`;
}

function titleCase(val?: string | null): string {
  if (!val) return "—";
  return val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

interface SpecItem {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
}

export default function SportDetailsHeader({ sport, contacts }: SportDetailsHeaderProps) {
  // Always exactly 6 specs, same order, every time — a badge that silently
  // disappears (or renders blank) when data is missing reads as broken; a
  // "—" placeholder reads as "not set yet" and keeps the row's layout stable.
  const specs: SpecItem[] = [
    { icon: GraduationCap, label: "League", value: ageGroupLabel(sport.ageGroup) },
    {
      icon: Users,
      label: "Teams",
      value: sport.maxTeams
        ? `${sport.registeredTeamsCount ?? 0}/${sport.maxTeams}`
        : sport.registeredTeamsCount != null ? String(sport.registeredTeamsCount) : "—",
    },
    {
      icon: Weight,
      label: "Weight",
      value: sport.weightLimitKg != null ? `${sport.weightLimitKg} KG` : (formatWeightClass(sport.weightClass) || "—"),
    },
    { icon: Layers, label: "Format", value: titleCase(sport.formatType) },
    { icon: Wallet, label: "Entry Fee", value: formatCurrency(sport.entryFee) },
    { icon: Trophy, label: "Prize Pool", value: formatCurrency(sport.prizeMoney) },
  ];

  return (
    <section
      className="event-details"
      style={{
        "--plane": `url(${plane})`,
        "--star": `url(${star})`,
      } as React.CSSProperties}
    >
      <div className="contact-buttons">
        {contacts.length === 0 && (
          <p style={{ fontSize: 14, color: "#666" }}>Contact details will be published closer to the event.</p>
        )}
        {contacts.map((contact) => (
          <div key={contact.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {contact.phone && (
              <button type="button" onClick={() => window.open(`tel:${contact.phone}`, "_self")}>
                {contact.roleLabel || contact.name || "Call"}
              </button>
            )}
            {contact.phone && (
              <button type="button" onClick={() => window.open(waLink(contact.phone!), "_blank")}>
                WhatsApp
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="event-info">
        <h2>{sport.sport?.replace(/_/g, " ") ?? "Sport"}</h2>
        <p>{sport.sportsDescription || "Details for this competition will be published soon."}</p>

        {sport.mapUrl && (
          <p style={{ margin: "4px 0 10px" }}>
            <a href={sport.mapUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0162D1", fontWeight: 600 }}>
              <MapPin size={15} /> View location on map
            </a>
          </p>
        )}

        {sport.prizeDistribution && sport.prizeDistribution.length > 0 && (
          <div style={{ margin: "0 0 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sport.prizeDistribution.map((p, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 600, background: "rgba(1,98,209,0.08)", border: "1px solid rgba(1,98,209,0.2)", borderRadius: 999, padding: "3px 10px" }}>
                {formatPrizePosition(p)}
              </span>
            ))}
          </div>
        )}

        <div className="sport-stats">
          {specs.map((spec) => (
            <div className="sport-stat" key={spec.label}>
              <spec.icon size={22} />
              <div>
                <div className="sport-stat-label">{spec.label}</div>
                <div className="sport-stat-value">{spec.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
