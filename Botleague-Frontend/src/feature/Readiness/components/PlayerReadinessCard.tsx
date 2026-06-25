import { usePlayerReadiness } from "../hooks/usePlayerReadiness";
import type { UpdateReadinessRequest } from "../api/playerReadiness.api";

const ACCENT = "#fa4715";
const CARD = "rgba(0,0,0,0.32)";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#ffffff";
const MUTED = "#9ca3af";
const GREEN = "#4ade80";

interface CheckItem {
  key: keyof UpdateReadinessRequest;
  label: string;
  icon: string;
}

const ITEMS: CheckItem[] = [
  { key: "ready",             label: "Ready for Match",    icon: "✅" },
  { key: "arrivedAtVenue",    label: "Arrived at Venue",   icon: "📍" },
  { key: "robotChecked",      label: "Robot Checked",      icon: "🤖" },
  { key: "batteryCharged",    label: "Battery Charged",    icon: "🔋" },
  { key: "equipmentVerified", label: "Equipment Verified", icon: "🔧" },
];

interface Props {
  matchId: string;
}

export function PlayerReadinessCard({ matchId }: Props) {
  const { readiness, loading, error, update } = usePlayerReadiness(matchId);

  if (loading) {
    return (
      <div style={{ color: MUTED, padding: "16px", textAlign: "center" }}>
        Loading readiness…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "#f87171", padding: "16px", textAlign: "center" }}>
        {error}
      </div>
    );
  }

  const percent = readiness?.readinessPercent ?? 0;

  const toggle = async (key: keyof UpdateReadinessRequest) => {
    const current = readiness ? (readiness as unknown as Record<string, unknown>)[key] as boolean : false;
    await update({ [key]: !current });
  };

  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        padding: "20px 22px",
        color: TEXT,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ fontWeight: 700, fontSize: "15px" }}>Match Readiness</span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: percent === 100 ? GREEN : ACCENT,
          }}
        >
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "6px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "3px",
          overflow: "hidden",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: percent === 100 ? GREEN : ACCENT,
            borderRadius: "3px",
            transition: "width 0.35s ease",
          }}
        />
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {ITEMS.map(({ key, label, icon }) => {
          const checked = readiness ? (readiness as unknown as Record<string, unknown>)[key] as boolean : false;
          return (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                userSelect: "none",
                padding: "8px 10px",
                borderRadius: "8px",
                background: checked ? "rgba(74,222,128,0.07)" : "transparent",
                border: `1px solid ${checked ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.05)"}`,
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(key)}
                style={{ display: "none" }}
              />
              {/* Custom checkbox */}
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "5px",
                  border: `2px solid ${checked ? GREEN : "rgba(255,255,255,0.25)"}`,
                  background: checked ? GREEN : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s, border-color 0.2s",
                }}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: "14px" }}>{icon} {label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default PlayerReadinessCard;
