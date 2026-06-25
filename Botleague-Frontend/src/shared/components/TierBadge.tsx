// ============================================================
// TierBadge — reusable prestige tier indicator
// S_TIER: gold crown   A_TIER: silver star   B_TIER: bronze
// ============================================================


export type EventTier = "S_TIER" | "A_TIER" | "B_TIER"

interface TierConfig {
  label:   string
  icon:    string
  color:   string
  border:  string
  bg:      string
  glow:    string
  shimmer: boolean
}

const TIER_CONFIG: Record<EventTier, TierConfig> = {
  S_TIER: {
    label:   "S-Tier",
    icon:    "👑",
    color:   "#fbbf24",
    border:  "rgba(251,191,36,0.55)",
    bg:      "rgba(251,191,36,0.12)",
    glow:    "0 0 12px rgba(251,191,36,0.35)",
    shimmer: true,
  },
  A_TIER: {
    label:   "A-Tier",
    icon:    "⭐",
    color:   "#60a5fa",
    border:  "rgba(96,165,250,0.45)",
    bg:      "rgba(96,165,250,0.10)",
    glow:    "0 0 8px rgba(96,165,250,0.25)",
    shimmer: false,
  },
  B_TIER: {
    label:   "B-Tier",
    icon:    "🏅",
    color:   "#fa8c4f",
    border:  "rgba(250,140,79,0.40)",
    bg:      "rgba(250,140,79,0.09)",
    glow:    "none",
    shimmer: false,
  },
}

interface TierBadgeProps {
  tier?:    string | null
  size?:    "sm" | "md" | "lg"
  showIcon?: boolean
}

export default function TierBadge({ tier, size = "md", showIcon = true }: TierBadgeProps) {
  const key = (tier ?? "B_TIER") as EventTier
  const cfg = TIER_CONFIG[key] ?? TIER_CONFIG.B_TIER

  const fontSize = size === "sm" ? "0.62rem" : size === "lg" ? "0.85rem" : "0.72rem"
  const padding  = size === "sm" ? "2px 7px"  : size === "lg" ? "6px 14px" : "3px 10px"
  const iconSize = size === "lg" ? "1rem" : "0.82rem"

  return (
    <>
      {cfg.shimmer && (
        <style>{`
          @keyframes tier-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          .tier-s-shimmer {
            background: linear-gradient(90deg,
              rgba(251,191,36,0.12) 0%,
              rgba(251,191,36,0.28) 40%,
              rgba(255,236,153,0.35) 50%,
              rgba(251,191,36,0.28) 60%,
              rgba(251,191,36,0.12) 100%
            );
            background-size: 200% auto;
            animation: tier-shimmer 2.8s linear infinite;
          }
        `}</style>
      )}
      <span
        className={cfg.shimmer ? "tier-s-shimmer" : undefined}
        style={{
          display:      "inline-flex",
          alignItems:   "center",
          gap:          "4px",
          padding,
          borderRadius: "999px",
          border:       `1px solid ${cfg.border}`,
          background:   cfg.shimmer ? undefined : cfg.bg,
          color:        cfg.color,
          fontSize,
          fontWeight:   700,
          letterSpacing: "0.04em",
          boxShadow:    cfg.glow,
          whiteSpace:   "nowrap",
          userSelect:   "none",
        }}
      >
        {showIcon && <span style={{ fontSize: iconSize }}>{cfg.icon}</span>}
        {cfg.label}
      </span>
    </>
  )
}

/** Standalone helper — returns the visual config for a tier string */
// eslint-disable-next-line react-refresh/only-export-components
export function getTierConfig(tier?: string | null): TierConfig {
  const key = (tier ?? "B_TIER") as EventTier
  return TIER_CONFIG[key] ?? TIER_CONFIG.B_TIER
}
