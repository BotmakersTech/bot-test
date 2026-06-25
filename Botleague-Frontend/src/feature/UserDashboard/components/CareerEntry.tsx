import Badge from "./Badge";

type Props = {
  year: number;
  team: string;
  role: string;
  result?: string;
  isLast?: boolean;
};

export default function CareerEntry({
  year,
  team,
  role,
  result,
  isLast,
}: Props) {
  return (
    <div
      className="flex gap-4"
      style={{ position: "relative" }}
    >
      {!isLast && (
        <div
          style={{
            position: "absolute",
            left: "15px",
            top: "32px",
            bottom: "-12px",
            width: "2px",
            background:
              "rgba(255,255,255,0.07)",
          }}
        />
      )}

      <div
        style={{
          flexShrink: 0,
          paddingTop: "4px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, #fa4715, #f97316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.65rem",
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
            boxShadow:
              "0 0 12px rgba(250,71,21,0.35)",
          }}
        >
          {year.toString().slice(-2)}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background: "rgba(0,0,0,0.2)",
          border:
            "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          padding: "14px 16px",
          marginBottom: "12px",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#fff",
                fontSize: "0.95rem",
              }}
            >
              {team}
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: "0.8rem",
                marginTop: "2px",
              }}
            >
              {role} · {year}
            </div>
          </div>

          {result && (
            <Badge
              color={
                result.includes("🏆")
                  ? "#fbbf24"
                  : "#9ca3af"
              }
              bg={
                result.includes("🏆")
                  ? "rgba(251,191,36,0.12)"
                  : "rgba(255,255,255,0.06)"
              }
            >
              {result}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}