import type { EventSportResponse, SupportContact } from "../../api/event.api";

interface SportDetailsHeaderProps {
  sport: EventSportResponse;
  contacts: SupportContact[];
}

function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://api.whatsapp.com/send/?phone=${digits}`;
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
      </div>
    </section>
  );
}
