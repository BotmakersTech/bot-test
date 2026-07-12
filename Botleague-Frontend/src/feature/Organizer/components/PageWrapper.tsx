import React from "react"
import "../../../styles/organizerTheme.css"

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="org-page-bg" style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
