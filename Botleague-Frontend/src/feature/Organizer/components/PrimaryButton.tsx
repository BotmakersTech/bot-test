import React from "react"
import { ORG } from "../theme/organizerTheme"

type Variant = "primary" | "outline" | "danger"

export default function PrimaryButton({
  children,
  variant = "primary",
  disabled,
  style,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    borderRadius: ORG.radiusBtn,
    padding: "9px 18px",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.65 : 1,
    transition: "filter 0.15s",
  }

  const variantStyle: React.CSSProperties =
    variant === "primary"
      ? { background: ORG.gradientCta, color: "#fff", boxShadow: ORG.btnShadow }
      : variant === "danger"
      ? { background: "rgba(224,75,75,0.1)", color: ORG.danger, border: "1px solid rgba(224,75,75,0.3)" }
      : { background: "#fff", color: ORG.blueHeading, border: `1.5px solid ${ORG.blue}` }

  return (
    <button {...rest} disabled={disabled} style={{ ...base, ...variantStyle, ...style }}>
      {children}
    </button>
  )
}
