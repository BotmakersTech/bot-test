import { useState } from "react";
import type { ElementType } from "react";

import { Lock } from "lucide-react";

import { tokens } from "../util/token";

// ======================================================
// TYPES
// ======================================================

interface ActionBtnProps {

  icon?: ElementType;

  label: string;

  onClick?: () => void;

  accent?: boolean;

  small?: boolean;

  disabled?: boolean;
}

// ======================================================
// COMPONENT
// ======================================================

export default function ActionBtn({

  icon: Icon,

  label,

  onClick,

  accent = false,

  small = false,

  disabled = false,

}: ActionBtnProps) {

  // ======================================================
  // STATE
  // ======================================================

  const [hov, setHov] =
    useState(false);

  // ======================================================
  // RENDER
  // ======================================================

  return (

    <button

      onClick={
        disabled
          ? undefined
          : onClick
      }

      onMouseEnter={() => {

        if (!disabled) {

          setHov(true);
        }
      }}

      onMouseLeave={() => {

        setHov(false);
      }}

      disabled={disabled}

      title={
        disabled
          ? "Only the captain can do this"
          : undefined
      }

      style={{

        background:
          disabled
            ? "rgba(255,255,255,0.03)"
            : accent
            ? hov
              ? tokens.accentHover
              : tokens.accent
            : hov
            ? "rgba(255,255,255,0.1)"
            : "rgba(255,255,255,0.06)",

        border:
          disabled
            ? "1px solid rgba(255,255,255,0.05)"
            : accent
            ? "none"
            : `1px solid ${tokens.border}`,

        color:
          disabled
            ? tokens.textSub
            : tokens.text,

        padding:
          small
            ? "7px 14px"
            : "10px 18px",

        borderRadius:
          tokens.radius,

        cursor:
          disabled
            ? "not-allowed"
            : "pointer",

        fontWeight: 600,

        fontSize:
          small
            ? "0.78rem"
            : "0.84rem",

        display: "inline-flex",

        alignItems: "center",

        justifyContent: "center",

        gap: "7px",

        transition:
          "all 0.15s ease",

        whiteSpace: "nowrap",

        lineHeight: 1,

        opacity:
          disabled
            ? 0.45
            : 1,
      }}
    >

      {disabled ? (

        <Lock
          size={
            small
              ? 11
              : 13
          }
        />

      ) : (

        Icon && (

          <Icon
            size={
              small
                ? 13
                : 15
            }
          />
        )
      )}

      {label}

    </button>
  );
}