import React from "react";


// ======================================================
// TYPES
// ======================================================

type Props = {

  icon: React.ReactNode;

  label: string;

  value: string | number;

  sub?: string;

  className?: string;
};


// ======================================================
// COMPONENT
// ======================================================

export default function StatCard({

  icon,

  label,

  value,

  sub,

  className = "",

}: Props) {

  return (

    <div
      className={`stat-card ${className}`}
      style={{
        background: "rgba(0,0,0,0.22)",

        border:
          "1px solid rgba(255,255,255,0.07)",

        borderRadius: "16px",

        padding: "20px 18px",

        backdropFilter: "blur(12px)",

        transition:
          "transform 0.2s ease, border-color 0.2s ease",
      }}
    >

      {/* ICON */}

      <div
        style={{
          fontSize: "1.5rem",

          marginBottom: "10px",

          color: "#fa4715",

          display: "flex",

          alignItems: "center",
        }}
      >
        {icon}
      </div>


      {/* LABEL */}

      <div
        style={{
          color: "#9ca3af",

          fontSize: "0.72rem",

          marginBottom: "8px",

          letterSpacing: "0.05em",

          textTransform: "uppercase",

          fontWeight: 600,
        }}
      >
        {label}
      </div>


      {/* VALUE */}

      <div
        style={{
          fontSize: "1.7rem",

          fontWeight: 800,

          color: "#fff",

          lineHeight: 1,
        }}
      >
        {value}
      </div>


      {/* SUBTEXT */}

      {sub && (

        <div
          style={{
            color: "#6b7280",

            fontSize: "0.72rem",

            marginTop: "6px",
          }}
        >
          {sub}
        </div>

      )}

    </div>
  );
}