import React from "react"
import { ORG } from "../theme/organizerTheme"

export default function Card({
  children,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        background: ORG.cardBg,
        border: ORG.cardBorder,
        borderRadius: ORG.radiusCard,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
