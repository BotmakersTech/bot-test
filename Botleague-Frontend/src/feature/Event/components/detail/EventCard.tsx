interface EventCardProps {
  image?: string | null;
  title: string;
  description?: string | null;
  disabled?: boolean;
  onExplore: () => void;
}

export default function EventCard({ image, title, description, disabled, onExplore }: EventCardProps) {
  return (
    <div className="event-card">
      <div className="image-box">
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            No image
          </div>
        )}
      </div>

      <h3>{title}</h3>

      <div className="divider" />

      <p>{description || "Details for this sport will be published soon."}</p>

      <button type="button" onClick={onExplore} disabled={disabled}>
        Explore
      </button>
    </div>
  );
}
