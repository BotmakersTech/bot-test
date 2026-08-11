import { ArrowRight, Trophy } from "lucide-react";

interface EventCardProps {
  image?: string | null;
  title: string;
  description?: string | null;
  disabled?: boolean;
  onExplore: () => void;
}

export default function EventCard({ image, title, description, disabled, onExplore }: EventCardProps) {
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
        <h3>{title}</h3>
        <div className="event-card-reveal">
          <p>{description || "Details for this sport will be published soon."}</p>
          <button type="button" className="event-card-view-details" onClick={handleExploreClick} disabled={disabled}>
            Explore <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
