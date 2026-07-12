// Plain-object mirror of styles/organizerTheme.css — most Organizer pages use
// inline style={{}} objects rather than CSS classes, so these values must be
// kept in sync with the CSS custom properties by hand (no CSS-vars-to-TS
// codegen exists in this project).

export const ORG = {
  blue: "#4b86e8",
  blue2: "#4c8ee7",
  blueHeading: "#3567cf",
  violet: "#8c6cff",
  violetHeading: "#5b62ea",
  gradientCta: "linear-gradient(135deg, #4c8ee7, #8c6cff)",
  gradientPill: "linear-gradient(135deg, #5d91df, #8d70ff)",

  text: "#111111",
  textStrong: "#080808",
  muted: "#5d5d5d",
  muted2: "#6c6c6c",
  muted3: "#7c7c7c",

  cardBg: "rgba(255, 255, 255, 0.9)",
  cardBorder: "1.5px solid #4b86e8",
  borderColor: "#4b86e8",

  success: "#1fa952",
  danger: "#e04b4b",
  warning: "#eab308",

  radiusCard: "12px",
  radiusPill: "999px",
  radiusBtn: "8px",
  btnShadow: "0 3px 4px rgba(82, 71, 159, 0.28)",

  fontHeading: "'Sarpanch', 'Inter', system-ui, sans-serif",
  fontBody: "'Inter', system-ui, sans-serif",

  pageBg: [
    "linear-gradient(132deg, transparent 0 9%, rgba(69, 119, 222, 0.07) 9% 12%, transparent 12% 100%)",
    "linear-gradient(132deg, transparent 0 76%, rgba(140, 108, 255, 0.06) 76% 79%, transparent 79% 100%)",
    "transparent",
  ].join(", "),
} as const;
