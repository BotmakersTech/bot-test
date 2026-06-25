import { useState } from "react";


const MUTED  = "#9ca3af";
const BORDER = "rgba(255,255,255,0.08)";

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  "Title Sponsor":      { bg: "rgba(250,71,21,0.15)",  color: "#fa4715" },
  "Gold Sponsor":       { bg: "rgba(251,191,36,0.14)", color: "#fbbf24" },
  "Silver Sponsor":     { bg: "rgba(156,163,175,0.14)",color: "#9ca3af" },
  "Bronze Sponsor":     { bg: "rgba(180,120,60,0.14)", color: "#cd7f32" },
  "Technology Partner": { bg: "rgba(96,165,250,0.12)", color: "#60a5fa" },
  "Media Partner":      { bg: "rgba(167,139,250,0.12)",color: "#a78bfa" },
  "Equipment Partner":  { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
};

export interface SponsorEntry {
  id: string;
  sponsorName: string;
  sponsorType: string | null;
  logoUrl: string | null;
  website: string | null;
}

interface SponsorLogoTileProps {
  sponsor: SponsorEntry;
}

function SponsorLogoTile({ sponsor }: SponsorLogoTileProps) {
  const [imgErr, setImgErr] = useState(false);
  const typeStyle = sponsor.sponsorType ? (TYPE_COLOR[sponsor.sponsorType] ?? { bg: "rgba(255,255,255,0.06)", color: MUTED }) : null;

  const inner = (
    <div style={{
      background:   "rgba(0,0,0,0.3)",
      border:       `1px solid ${BORDER}`,
      borderRadius: "10px",
      padding:      "10px 14px",
      display:      "flex",
      flexDirection:"column",
      alignItems:   "center",
      gap:          "6px",
      minWidth:     "80px",
      maxWidth:     "120px",
      cursor:       sponsor.website ? "pointer" : "default",
      transition:   "border 0.18s, background 0.18s",
    }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid rgba(250,71,21,0.3)`; e.currentTarget.style.background = "rgba(250,71,21,0.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${BORDER}`; e.currentTarget.style.background = "rgba(0,0,0,0.3)"; }}
    >
      {sponsor.logoUrl && !imgErr ? (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.sponsorName}
          onError={() => setImgErr(true)}
          style={{ height: "32px", maxWidth: "80px", objectFit: "contain", borderRadius: "4px" }}
        />
      ) : (
        <div style={{
          height: "32px", width: "60px",
          background: "rgba(255,255,255,0.07)",
          borderRadius: "6px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.6rem", fontWeight: 700, color: MUTED, textTransform: "uppercase",
          letterSpacing: "0.06em", textAlign: "center", padding: "0 4px",
        }}>
          {sponsor.sponsorName.slice(0, 12)}
        </div>
      )}
      <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#e5e7eb", textAlign: "center", maxWidth: "100px", lineHeight: 1.2 }}>
        {sponsor.sponsorName}
      </div>
      {typeStyle && sponsor.sponsorType && (
        <div style={{
          background: typeStyle.bg,
          color: typeStyle.color,
          borderRadius: "4px",
          fontSize: "0.52rem",
          padding: "1px 5px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>
          {sponsor.sponsorType}
        </div>
      )}
    </div>
  );

  if (sponsor.website) {
    return (
      <a href={sponsor.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        {inner}
      </a>
    );
  }
  return inner;
}

interface SponsorStripProps {
  sponsors: SponsorEntry[];
  label?: string;
  compact?: boolean;
}

export default function SponsorStrip({ sponsors, label = "Sponsored By", compact = false }: SponsorStripProps) {
  if (!sponsors.length) return null;

  return (
    <div style={{ marginTop: compact ? "8px" : "12px" }}>
      <div style={{
        fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
        color: MUTED, textTransform: "uppercase", marginBottom: "8px",
      }}>
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-start" }}>
        {sponsors.map(s => <SponsorLogoTile key={s.id} sponsor={s} />)}
      </div>
    </div>
  );
}
