import React from "react"
import { ORG } from "../theme/organizerTheme"

type Tone = "blue" | "success" | "warning" | "danger" | "muted"

const TONE_COLORS: Record<Tone, { bg: string; border: string; color: string }> = {
  blue:    { bg: "rgba(75,134,232,0.1)",  border: "rgba(75,134,232,0.3)",  color: ORG.blueHeading },
  success: { bg: "rgba(31,169,82,0.1)",   border: "rgba(31,169,82,0.3)",   color: ORG.success },
  warning: { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.3)",   color: "#a16207" },
  danger:  { bg: "rgba(224,75,75,0.1)",   border: "rgba(224,75,75,0.3)",   color: ORG.danger },
  muted:   { bg: "rgba(93,93,93,0.08)",   border: "rgba(93,93,93,0.22)",   color: ORG.muted },
}

export default function Pill({
  children,
  tone = "blue",
  icon,
}: {
  children: React.ReactNode
  tone?: Tone
  icon?: React.ReactNode
}) {
  const t = TONE_COLORS[tone]
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      background: t.bg,
      border: `1px solid ${t.border}`,
      color: t.color,
      borderRadius: ORG.radiusPill,
      fontSize: "0.67rem",
      padding: "3px 10px",
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      {icon}
      {children}
    </span>
  )
}
