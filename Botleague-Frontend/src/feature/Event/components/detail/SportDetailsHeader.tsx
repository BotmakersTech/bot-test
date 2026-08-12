import { Users, Weight, Wallet, Trophy } from "lucide-react";
import type { EventSportResponse, SupportContact } from "../../api/event.api";

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

export default function SportDetailsHeader({ sport, contacts }: SportDetailsHeaderProps) {
  return (
    <section className="event-details">
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

        <div className="sport-stats">
          <div className="sport-stat">
            <Users size={22} />
            <div>
              <div className="sport-stat-label">Teams</div>
              <div className="sport-stat-value">
                {sport.registeredTeamsCount ?? 0}{sport.maxTeams ? `/${sport.maxTeams}` : ""}
              </div>
            </div>
          </div>
          <div className="sport-stat">
            <Weight size={22} />
            <div>
              <div className="sport-stat-label">Weight</div>
              <div className="sport-stat-value">
                {sport.weightLimitKg != null ? `${sport.weightLimitKg} Kg` : sport.weightClass || "—"}
              </div>
            </div>
          </div>
          <div className="sport-stat">
            <Wallet size={22} />
            <div>
              <div className="sport-stat-label">Entry Fee</div>
              <div className="sport-stat-value">{formatCurrency(sport.entryFee)}</div>
            </div>
          </div>
          <div className="sport-stat">
            <Trophy size={22} />
            <div>
              <div className="sport-stat-label">Prize Pool</div>
              <div className="sport-stat-value">{formatCurrency(sport.prizeMoney)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
