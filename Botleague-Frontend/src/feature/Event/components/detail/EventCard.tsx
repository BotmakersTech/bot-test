import { Trophy } from "lucide-react";

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

      <h3>{title}</h3>

      <div className="event-card-reveal">
        <div className="divider" />
        <p>{description || "Details for this sport will be published soon."}</p>
        <button type="button" onClick={handleExploreClick} disabled={disabled}>
          Explore
        </button>
      </div>
    </div>
  );
}
