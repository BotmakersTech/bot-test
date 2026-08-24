import React from "react"
import "../../../styles/organizerTheme.css"

export default function PageWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`org-page-bg p-8${className ? ` ${className}` : ""}`}>
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
