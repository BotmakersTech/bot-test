import Badge from "./Badge";

type Props = {
  name: string;
  role: string;
  status?: string;
  logo?: string | null;
  isCurrent?: boolean;
  onClick?: () => void;
};

export default function TeamCard({
  name,
  role,
  status,
  logo,
  isCurrent,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isCurrent
          ? "linear-gradient(135deg, rgba(250,71,21,0.12), rgba(249,115,22,0.06))"
          : "rgba(0,0,0,0.2)",

        border: isCurrent
          ? "1px solid rgba(250,71,21,0.35)"
          : "1px solid rgba(255,255,255,0.07)",

        borderRadius: "16px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor =
          "rgba(250,71,21,0.4)";

        e.currentTarget.style.transform =
          "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor =
          isCurrent
            ? "rgba(250,71,21,0.35)"
            : "rgba(255,255,255,0.07)";

        e.currentTarget.style.transform =
          "translateY(0)";
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background:
            "linear-gradient(135deg, #fa4715, #f97316)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          fontWeight: 800,
          flexShrink: 0,
          color: "#fff",
          overflow: "hidden",
        }}
      >
        {logo ? (
          <img
            src={logo}
            alt={name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : "NA"}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "#fff",
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>

        <div
          style={{
            color: "#9ca3af",
            fontSize: "0.78rem",
            marginTop: "2px",
          }}
        >
          {role}
        </div>
      </div>

      <div>
        {isCurrent ? (
          <Badge
            color="#4ade80"
            bg="rgba(74,222,128,0.12)"
          >
            Current
          </Badge>
        ) : (
          <Badge
            color="#6b7280"
            bg="rgba(107,114,128,0.08)"
          >
            {status || "Past"}
          </Badge>
        )}
      </div>
    </div>
  );
}