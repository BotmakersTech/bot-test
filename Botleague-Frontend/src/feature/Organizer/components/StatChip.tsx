import React from "react"
import { ORG } from "../theme/organizerTheme"

export default function StatChip({
  icon,
  label,
  value,
  color = ORG.blueHeading,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div style={{
      background: ORG.cardBg,
      border: ORG.cardBorder,
      borderRadius: ORG.radiusCard,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      flex: 1,
      minWidth: "130px",
    }}>
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{
          fontSize: "0.65rem",
          color: ORG.muted,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          {label}
        </div>
        <div style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color,
          fontFamily: ORG.fontHeading,
        }}>
          {value}
        </div>
      </div>
    </div>
  )
}
