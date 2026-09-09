import { ArrowLeft } from "lucide-react";

interface HeroProps {
  title: string;
  imageUrl?: string | null;
  /** Teaser/promo video. When set it plays muted+looping as the hero
   * background; `imageUrl` (if any) is used as its poster and as the
   * static fallback while it loads or if playback fails. */
  videoUrl?: string | null;
  /** Mobile only (desktop hero is unchanged) — shown when the caller passes
   * both a label and a handler, e.g. "Robo War" -> back to its event. */
  backLabel?: string;
  onBack?: () => void;
}

export default function Hero({  imageUrl, videoUrl, backLabel, onBack }: HeroProps) {
  return (
    <section
      className="hero"
      style={
        imageUrl
          ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {videoUrl && (
        <video
          className="hero-bg-video"
          src={videoUrl}
          poster={imageUrl ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      {onBack && (
        <button type="button" className="hero-back-btn" onClick={onBack} aria-label={backLabel ? `Back to ${backLabel}` : "Back"}>
          <ArrowLeft size={16} />
          {backLabel && <span>{backLabel}</span>}
        </button>
      )}
      {/* <div className="overlay">
        <h1>{title}</h1>
      </div> */}
    </section>
  );
}
