

export type AgeCategory = "JUNIOR_INNOVATORS" | "YOUNG_ENGINEERS" | "ROBO_MINDS"

interface CategoryConfig {
  label: string
  ageRange: string
  icon: string
  color: string
  glow: string
}

const CATEGORY_CONFIG: Record<AgeCategory, CategoryConfig> = {
  JUNIOR_INNOVATORS: {
    label: "Junior Innovators",
    ageRange: "8–11 yrs",
    icon: "🤖",
    color: "#4ade80",
    glow: "rgba(74,222,128,0.25)",
  },
  YOUNG_ENGINEERS: {
    label: "Young Engineers",
    ageRange: "12–17 yrs",
    icon: "⚡",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.25)",
  },
  ROBO_MINDS: {
    label: "Robo Minds",
    ageRange: "18+ yrs",
    icon: "🏆",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.25)",
  },
}

interface CategoryBadgeProps {
  category?: string | null
  size?: "xs" | "sm" | "md" | "lg"
  showAgeRange?: boolean
  showIcon?: boolean
}

const SIZES = {
  xs: { fontSize: "0.6rem",  padding: "2px 7px",   iconSize: "0.65rem", gap: "4px" },
  sm: { fontSize: "0.68rem", padding: "3px 9px",   iconSize: "0.75rem", gap: "5px" },
  md: { fontSize: "0.8rem",  padding: "5px 12px",  iconSize: "0.9rem",  gap: "6px" },
  lg: { fontSize: "0.9rem",  padding: "7px 16px",  iconSize: "1.1rem",  gap: "8px" },
}

export function getCategoryConfig(category?: string | null): CategoryConfig | null {
  if (!category) return null
  return CATEGORY_CONFIG[category as AgeCategory] ?? null
}

export default function CategoryBadge({
  category,
  size = "sm",
  showAgeRange = false,
  showIcon = true,
}: CategoryBadgeProps) {
  const cfg = getCategoryConfig(category)
  if (!cfg) return null

  const s = SIZES[size]

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        background: `${cfg.color}15`,
        border: `1px solid ${cfg.color}45`,
        borderRadius: "999px",
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 700,
        color: cfg.color,
        letterSpacing: "0.02em",
        boxShadow: `0 0 8px ${cfg.glow}`,
        whiteSpace: "nowrap",
      }}
    >
      {showIcon && (
        <span style={{ fontSize: s.iconSize, lineHeight: 1 }}>{cfg.icon}</span>
      )}
      {cfg.label}
      {showAgeRange && (
        <span style={{ opacity: 0.75, fontWeight: 500 }}>· {cfg.ageRange}</span>
      )}
    </span>
  )
}
