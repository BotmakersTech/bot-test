type Props = {
  label: string;
  value: number;
  max?: number;
  color?: string;
};

export default function PerfBar({
  label,
  value,
  max = 100,
  color = "#fa4715",
}: Props) {
  const pct = Math.round(
    (value / max) * 100
  );

  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "6px" }}
      >
        <span
          style={{
            color: "#d1d5db",
            fontSize: "0.85rem",
          }}
        >
          {label}
        </span>

        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.85rem",
          }}
        >
          {value}

          <span style={{ color: "#6b7280" }}>
            /{max}
          </span>
        </span>
      </div>

      <div
        style={{
          height: "6px",
          background:
            "rgba(255,255,255,0.06)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(
              90deg,
              ${color},
              ${color}cc
            )`,
            borderRadius: "999px",
            animation:
              "barGrow 0.8s ease both",
          }}
        />
      </div>
    </div>
  );
}