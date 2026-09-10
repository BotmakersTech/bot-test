import { useState } from "react";
import { Weight, Wallet, Trophy, GraduationCap, Layers, Ruler, FileText, Phone, MessageCircle, User, Mail, X } from "lucide-react";
import { formatPrizePosition } from "../../../../shared/utils/prize";
import type { ComponentType } from "react";
import type { EventSportResponse, SupportContact } from "../../api/event.api";
import plane from "../../../../assets/Auth/plane.svg";
import star from "../../../../assets/Auth/Star-two.svg";
import { formatWeightClass } from "../../../Robots/constants/weightClasses";
import { ageGroupLabel } from "../../../../shared/utils/ageGroup";
import { constraintsFor } from "../../utils/specPolicy";
import RegistrationTab from "./RegistrationTab";
import type { RegistrationTabProps } from "./RegistrationTab";

interface SportDetailsHeaderProps extends Omit<RegistrationTabProps, "sport"> {
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

interface SpecItem {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string | null;
}

type TabKey = "problem" | "spec" | "contact" | "prize";

export default function SportDetailsHeader({ sport, contacts, ...registrationProps }: SportDetailsHeaderProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("problem");
  const [rulebookOpen, setRulebookOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Only the spec(s) this (league, sport) actually gates get a stat box — a
  // RoboWar shows Weight, RC Racing Car shows Scale (never a leftover
  // "Weight: Open" placeholder), a drone shows neither. See specPolicy.ts.
  const gates = constraintsFor(sport.ageGroup, sport.sport);
  const weight = gates.weight
    ? (sport.weightLimitKg != null ? `${sport.weightLimitKg} KG` : (formatWeightClass(sport.weightClass) || null))
    : null;
  const dims = gates.dimension && sport.maxLengthCm != null && sport.maxWidthCm != null && sport.maxHeightCm != null
    ? `${sport.maxLengthCm}×${sport.maxWidthCm}×${sport.maxHeightCm} cm`
    : null;
  const scale = gates.scale ? (sport.extraRules?.scale || null) : null;

  const specs: SpecItem[] = [
    { icon: GraduationCap, label: "League", value: ageGroupLabel(sport.ageGroup) || null },
    { icon: Weight, label: "Weight", value: weight },
    { icon: Layers, label: "Dimensions", value: dims },
    { icon: Ruler, label: "Scale", value: scale },
    { icon: Wallet, label: "Entry Fee", value: sport.entryFee != null ? formatCurrency(sport.entryFee) : null },
  ].filter((s) => s.value && s.value !== "—") as SpecItem[];

  // Optional rulebook link — only shown when the event actually has one.
  const rulebookUrl = sport.extraRules?.rulebookUrl as string | undefined;

  const prizePool = sport.prizeMoney != null ? formatCurrency(sport.prizeMoney) : null;
  const hasPrizeDistribution = !!sport.prizeDistribution && sport.prizeDistribution.length > 0;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "problem", label: "Problem Statement" },
    { key: "spec", label: "Specification" },
    { key: "contact", label: "Contact" },
    { key: "prize", label: "Prize" },
  ];

  return (
    <section
      className="event-details"
      style={{
        "--plane": `url(${plane})`,
        "--star": `url(${star})`,
        gridTemplateColumns: "1fr",
      } as React.CSSProperties}
    >
      <style>{TAB_CSS}</style>

      <div className="event-info" style={{ width: "100%" }}>
        {/* Left smaller, right bigger. Title sits above the right column only. */}
        <div className="rw-content-row">
          <div className="rw-col-blank">
            <button type="button" className="rw-register-btn" onClick={() => setRegisterOpen(true)}>
              Register
            </button>
          </div>

          <div className="rw-col-content">
            {/* Event name — blue, above the right column only, shifted up */}
            <div className="rw-page-title">{sport.sport?.replace(/_/g, " ") ?? "Techsport"}</div>

            {/* Connected segmented tab bar, square corners */}
            <div className="rw-tab-nav">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`rw-tab-btn ${activeTab === t.key ? "rw-tab-btn-active" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="rw-tab-body">
              {activeTab === "problem" && (
                <div className="rw-tab-desc">
                  {sport.sportsDescription || "Details for this competition will be published soon."}
                </div>
              )}

              {activeTab === "spec" && (
                <>
                  {specs.length > 0 ? (
                    <div className="rw-card-grid">
                      {specs.map((spec) => (
                        <div className="rw-detail-card" key={spec.label}>
                          <spec.icon size={22} />
                          <div>
                            <div className="rw-detail-card-label">{spec.label}</div>
                            <div className="rw-detail-card-value">{spec.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rw-tab-desc">Specification details will be published closer to the event.</div>
                  )}
                  <button type="button" className="rw-rulebook-btn" onClick={() => setRulebookOpen(true)}>
                    <FileText size={18} />
                    View rulebook
                  </button>
                </>
              )}

              {activeTab === "contact" && (
                <>
                  {contacts.length === 0 ? (
                    <div className="rw-tab-desc">Contact details will be published closer to the event.</div>
                  ) : (
                    contacts.map((contact) => {
                      const email = (contact as SupportContact & { email?: string }).email;
                      const fields = [
                        { icon: User, label: "NAME", value: contact.roleLabel ? `${contact.name || "—"} (${contact.roleLabel})` : (contact.name || "—") },
                        { icon: Mail, label: "EMAIL", value: email || null },
                        { icon: Phone, label: "MOBILE", value: contact.phone || null },
                      ].filter((f) => f.value) as { icon: typeof User; label: string; value: string }[];

                      return (
                        <div key={contact.id} style={{ marginBottom: "1.5rem" }}>
                          <div className="rw-card-grid">
                            {fields.map((f) => (
                              <div className="rw-detail-card" key={f.label}>
                                <f.icon size={22} />
                                <div>
                                  <div className="rw-detail-card-label">{f.label}</div>
                                  <div className="rw-detail-card-value">{f.value}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {contact.phone && (
                            <div className="rw-contact-actions">
                              <button
                                type="button"
                                className="rw-contact-btn"
                                onClick={() => window.open(`tel:${contact.phone}`, "_self")}
                              >
                                <Phone size={14} />
                                Call
                              </button>
                              <button
                                type="button"
                                className="rw-contact-btn"
                                onClick={() => window.open(waLink(contact.phone!), "_blank")}
                              >
                                <MessageCircle size={14} />
                                WhatsApp
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activeTab === "prize" && (
                <>
                  {hasPrizeDistribution && (
                    <div className="rw-prize-list">
                      {sport.prizeDistribution!.map((p, i) => (
                        <div className="rw-prize-row" key={i}>
                          <span className="rw-prize-row-position">{formatPrizePosition(p)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {prizePool ? (
                    <div className="rw-card-grid rw-card-grid-single">
                      <div className="rw-detail-card">
                        <Trophy size={22} />
                        <div>
                          <div className="rw-detail-card-label">Total Prize Pool</div>
                          <div className="rw-detail-card-value">{prizePool}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    !hasPrizeDistribution && (
                      <div className="rw-tab-desc">Prize details will be published closer to the event.</div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {rulebookOpen && (
        <div className="rw-modal-backdrop" onClick={() => setRulebookOpen(false)}>
          <div className="rw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rw-modal-header">
              <h4>Rulebook</h4>
              <button type="button" className="rw-modal-close" onClick={() => setRulebookOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="rw-modal-body">
              <p className="rw-modal-intro">
                Rules for {sport.sport?.replace(/_/g, " ") ?? "this event"}:
              </p>
              <ul className="rw-rulebook-list">
                <li>Every bot must pass safety and weight-class inspection before its first match.</li>
                <li>Matches are decided by knockout, judge decision, or ring-out.</li>
                <li>No projectiles or entanglement weapons without prior clearance.</li>
                <li>Repairs are allowed only in the designated pit window between matches.</li>
                <li>Unsportsmanlike conduct results in immediate disqualification.</li>
              </ul>
              {rulebookUrl && (
                <a className="rw-rulebook-btn" href={rulebookUrl} target="_blank" rel="noreferrer">
                  <FileText size={18} />
                  Download full rulebook
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {registerOpen && (
        <div className="rw-modal-backdrop" onClick={() => setRegisterOpen(false)}>
          <div className="rw-modal rw-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="rw-modal-header">
              <h4>Register for {sport.sport?.replace(/_/g, " ") ?? "this event"}</h4>
              <button type="button" className="rw-modal-close" onClick={() => setRegisterOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="rw-modal-body">
              <RegistrationTab sport={sport} {...registrationProps} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const TAB_CSS = `
/* Left small, right big */
.rw-content-row {
  display: grid;
  grid-template-columns: 1fr 2.4fr;
  gap: 2rem;
  align-items: stretch;
  max-width: 1200px;
  margin: 0 auto;
}
.rw-col-blank,
.rw-col-content {
  min-width: 0;
  min-height: 320px;
  border: none;
  border-radius: 16px;
  background: #fff;
  box-sizing: border-box;
}
.rw-col-blank {
  background: transparent;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 1.75rem;
}
.rw-col-content {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rw-register-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 240px;
  border: none;
  background: linear-gradient(90deg, #4A7DFF 0%, #9B6BFF 100%);
  color: #fff;
  font-family: "Orbitron", sans-serif;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.9rem 1.5rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.rw-register-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }

/* Title above the right column only, shifted up (tighter gap to tab bar) */
.rw-page-title {
  font-family: 'Sarpanch', sans-serif;
  font-weight: 600;
  color: #0162D1;
  text-align: left;
  font-size: clamp(2.6rem, 3vw, 2.4rem);
  margin: 0 0 -0.25rem;
}

/* Connected segmented tab bar — rounded pill container per Figma */
.rw-tab-nav {
  display: flex;
  flex-direction: row;
  border: 1.5px solid #0162D1;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.rw-tab-btn {
  flex: 1;
  text-align: center;
  border: none;
  border-right: 1.5px solid #0162D1;
  background: #fff;
  padding: 0.85rem 1rem;
  color: #1f2937;
  font-family: Inter, sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.rw-tab-btn:last-child { border-right: none; }
.rw-tab-btn:hover:not(.rw-tab-btn-active) { background: #F1EEFA; }
.rw-tab-btn-active {
  color: #fff;
  background: linear-gradient(90deg, #4A7DFF 0%, #9B6BFF 100%);
}

.rw-tab-body { flex: 1; }

.rw-tab-desc {
  font-family: 'Sarpanch', sans-serif;
  font-weight: 400;
  color: #222;
  font-size: 1.1rem;
  line-height: 1.8;
  margin: 0;
}

.rw-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.85rem;
  margin: 0.5rem 0 1.5rem;
}
.rw-card-grid-single { grid-template-columns: minmax(180px, 280px); }
.rw-detail-card {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  border: 1.5px solid #0162D1;
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
  background: #fff;
  min-width: 0;
}
.rw-detail-card svg { color: #0162D1; flex-shrink: 0; margin-top: 2px; }
.rw-detail-card > div { min-width: 0; flex: 1; }
.rw-detail-card-label {
  font-family: Inter, sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 600;
}
.rw-detail-card-value {
  font-family: Inter, sans-serif;
  font-size: 1.05rem;
  color: #111827;
  font-weight: 700;
  overflow-wrap: anywhere;
  word-break: break-word;
  margin-top: 2px;
}

.rw-contact-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.7rem; }
.rw-contact-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid #0162D1;
  background: #EAF1FC;
  color: #0162D1;
  font-family: Inter, sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
}

.rw-rulebook-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: #0162D1;
  color: #fff;
  font-family: "Orbitron", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}
.rw-rulebook-btn:hover { background: #024fa8; transform: translateY(-2px); }

.rw-rulebook-list { margin: 0 0 1.25rem; padding-left: 1.25rem; }
.rw-rulebook-list li {
  font-family: Inter, sans-serif;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.7;
}

/* Prize: compact pill badges laid out in a row, per Figma */
.rw-prize-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}
.rw-prize-row {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid #0162D1;
  border-radius: 999px;
  padding: 0.5rem 1.1rem;
  background: #EAF1FC;
}
.rw-prize-row-position {
  font-family: Inter, sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0162D1;
  white-space: nowrap;
}

.rw-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 20, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 1000;
}
.rw-modal {
  background: #fff;
  border-radius: 18px;
  max-width: 520px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.75rem;
}
.rw-modal-lg { max-width: 720px; }
.rw-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.rw-modal-header h4 { font-family: "Orbitron", sans-serif; color: #0162D1; margin: 0; font-weight: 600; }
.rw-modal-close { border: none; background: #F1EEFA; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; color: #3E3A5A; display: flex; align-items: center; justify-content: center; }
.rw-modal-intro { font-family: Inter, sans-serif; color: #333; line-height: 1.7; font-size: 0.95rem; margin-bottom: 1rem; }

@media (max-width: 767px) {
  .rw-content-row { grid-template-columns: 1fr; }
  .rw-col-blank { min-height: 0; padding: 0 0 1rem; }
  .rw-register-btn { max-width: 100%; }
  .rw-col-content { padding: 1.5rem 1.25rem; }
  .rw-card-grid { grid-template-columns: 1fr; }
  .rw-card-grid-single { grid-template-columns: 1fr; }
  .rw-tab-nav { flex-wrap: wrap; }
  .rw-tab-btn { border-right: none; border-bottom: 1.5px solid #0162D1; flex: 1 1 50%; }
}
`;