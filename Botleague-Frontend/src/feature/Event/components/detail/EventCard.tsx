import { ArrowRight, Trophy } from "lucide-react";

// Accent-gradient class per league, keyed on the stable ageGroup code —
// not the display label ageGroupLabel() returns, which comes from the
// backend catalog and can be renamed out from under a hardcoded string.
// Any league without an entry here just keeps the default purple/pink
// gradient (see .event-card-accent in eventDetail.css).
const LEAGUE_ACCENT_CLASS: Record<string, string> = {
  JUNIOR_INNOVATORS: "event-card-wrap--ignite",
  YOUNG_ENGINEERS: "event-card-wrap--inferno",
  ROBO_MINDS: "event-card-wrap--apex",
};

interface EventCardProps {
  image?: string | null;
  title: string;
  /** Weight class/limit — appended to the title so two entries of the same
   * sport (e.g. two Robowar weight classes in the same event) read as
   * distinct cards instead of two identical-looking "ROBOWAR" tiles. */
  category?: string | null;
  /** Age-group eligibility (Junior/Senior/Open/…) — shown as its own badge
   * so competitors can tell at a glance which league/division a card is
   * for before tapping through. */
  eligibleLeague?: string | null;
  /** Raw ageGroup code ("JUNIOR_INNOVATORS", …) — same value eligibleLeague
   * is derived from, kept separate because this one drives the accent
   * gradient color and needs the stable code, not the display label. */
  leagueCode?: string | null;
  description?: string | null;
  disabled?: boolean;
  onExplore: () => void;
}

export default function EventCard({ image, title, category, eligibleLeague, leagueCode, description, disabled, onExplore }: EventCardProps) {
  const accentClass = (leagueCode && LEAGUE_ACCENT_CLASS[leagueCode]) || "";
  const handleCardClick = () => {
    if (!disabled) onExplore();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onExplore();
    }
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExplore();
  };

  return (
    <div className={accentClass ? `event-card-wrap ${accentClass}` : "event-card-wrap"}>
      {/* Decorative accent blocks — sit behind the card, themed with the
         page's own blue/purple gradient. Purely visual, so hidden from
         assistive tech. */}
      <span className="event-card-accent event-card-accent--tl" aria-hidden="true" />
      <span className="event-card-accent event-card-accent--br" aria-hidden="true" />

      <div
        className="event-card"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
      >
        <div className="image-box">
          {image ? (
            <img src={image} alt={title} />
          ) : (
            <div className="image-box-fallback">
              <Trophy size={40} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="event-card-image-overlay" />

        <div className="event-card-body">
          <h3>{title}{category ? ` – ${category}` : ""}</h3>
          {eligibleLeague && <span className="event-card-league">{eligibleLeague}</span>}
          <div className="event-card-reveal">
            <p>{description || "Details for this sport will be published soon."}</p>
            <button type="button" className="event-card-view-details" onClick={handleExploreClick} disabled={disabled}>
              Explore <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}