import { ArrowLeft } from "lucide-react";

interface HeroProps {
  title: string;
  imageUrl?: string | null;
  /** Mobile only (desktop hero is unchanged) — shown when the caller passes
   * both a label and a handler, e.g. "Robo War" -> back to its event. */
  backLabel?: string;
  onBack?: () => void;
}

export default function Hero({ title, imageUrl, backLabel, onBack }: HeroProps) {
  return (
    <section
      className="hero"
      style={
        imageUrl
          ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {onBack && (
        <button type="button" className="hero-back-btn" onClick={onBack} aria-label={backLabel ? `Back to ${backLabel}` : "Back"}>
          <ArrowLeft size={16} />
          {backLabel && <span>{backLabel}</span>}
        </button>
      )}
      <div className="overlay">
        <h1>{title}</h1>
      </div>
    </section>
  );
}
