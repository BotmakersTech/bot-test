import React from "react";


// ======================================================
// TYPES
// ======================================================

interface PrimaryBtnProps {

  onClick?: () => void;

  children: React.ReactNode;

  disabled?: boolean;

  style?: React.CSSProperties;

  type?: "button" | "submit" | "reset";
}


// ======================================================
// COMPONENT
// ======================================================

export default function PrimaryBtn({

  onClick,

  children,

  disabled = false,

  style = {},

  type = "button",

}: PrimaryBtnProps) {

  return (

    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{

        background: disabled
          ? "#555"
          : "linear-gradient(135deg, #ff4d4d 0%, #fa4715 100%)",

        border: "none",

        color: "#fff",

        padding: "13px 24px",

        borderRadius: "12px",

        cursor: disabled
          ? "not-allowed"
          : "pointer",

        fontWeight: 700,

        fontSize: "0.95rem",

        width: "100%",

        transition: "opacity 0.2s",

        opacity: disabled ? 0.7 : 1,

        ...style,
      }}
    >

      {children}

    </button>
  );
}