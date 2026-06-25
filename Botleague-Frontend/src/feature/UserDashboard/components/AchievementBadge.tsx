import Badge from "./Badge";

type Props = {
  icon: string;
  title: string;
  desc: string;
  rarity: string;
};

export default function AchievementBadge({
  icon,
  title,
  desc,
  rarity,
}: Props) {
  const rarityMap = {
    gold: {
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.12)",
      border: "rgba(251,191,36,0.25)",
    },

    silver: {
      color: "#e2e8f0",
      bg: "rgba(226,232,240,0.08)",
      border: "rgba(226,232,240,0.2)",
    },

    bronze: {
      color: "#f97316",
      bg: "rgba(249,115,22,0.1)",
      border: "rgba(249,115,22,0.2)",
    },

    platinum: {
      color: "#67e8f9",
      bg: "rgba(103,232,249,0.1)",
      border: "rgba(103,232,249,0.2)",
    },
  };

  const r =
    rarityMap[
      rarity as keyof typeof rarityMap
    ] || rarityMap.silver;

  return (
    <div
      style={{
        background: r.bg,
        border: `1px solid ${r.border}`,
        borderRadius: "16px",
        padding: "16px",
      }}
    >
      <div>{icon}</div>

      <div>{title}</div>

      <div>{desc}</div>

      <Badge
        color={r.color}
        bg={r.bg}
      >
        {rarity}
      </Badge>
    </div>
  );
}