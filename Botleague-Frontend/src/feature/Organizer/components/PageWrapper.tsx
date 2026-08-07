import React from "react"
import "../../../styles/organizerTheme.css"

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="org-page-bg p-8">
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
