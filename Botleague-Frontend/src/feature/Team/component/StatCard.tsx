import { useState } from "react";
import type { ElementType } from "react";

import { tokens } from "../util/token";

// ======================================================
// TYPES
// ======================================================

interface StatCardProps {

  icon: ElementType;

  label: string;

  value: string | number;
}

// ======================================================
// COMPONENT
// ======================================================

export default function StatCard({

  icon: Icon,

  label,

  value,

}: StatCardProps) {

  // ======================================================
  // STATE
  // ======================================================

  const [hov, setHov] =
    useState(false);

  // ======================================================
  // RENDER
  // ======================================================

  return (

    <div

      onMouseEnter={() =>
        setHov(true)
      }

      onMouseLeave={() =>
        setHov(false)
      }

      style={{

        background:
          tokens.surfaceCard,

        border:
          `1px solid ${
            hov
              ? tokens.borderHover
              : tokens.border
          }`,

        borderRadius:
          tokens.radiusLg,

        padding: "20px",

        transition:
          "border-color 0.18s ease",

        backdropFilter:
          "blur(10px)",

        WebkitBackdropFilter:
          "blur(10px)",
      }}
    >

      {/* ===================================== */}
      {/* ICON */}
      {/* ===================================== */}

      <div
        style={{

          color:
            tokens.textMuted,

          marginBottom: "8px",

          display: "flex",

          alignItems: "center",
        }}
      >

        <Icon size={18} />

      </div>

      {/* ===================================== */}
      {/* LABEL */}
      {/* ===================================== */}

      <div
        style={{

          color:
            tokens.textMuted,

          fontSize: "0.73rem",

          marginBottom: "8px",

          fontWeight: 600,

          letterSpacing: "0.04em",

          textTransform:
            "uppercase",
        }}
      >

        {label}

      </div>

      {/* ===================================== */}
      {/* VALUE */}
      {/* ===================================== */}

      <div
        style={{

          fontSize: "1.75rem",

          fontWeight: 700,

          color:
            tokens.text,

          lineHeight: 1.1,
        }}
      >

        {value}

      </div>

    </div>
  );
}