type BadgeProps = {
  children: React.ReactNode;
  color?: string;
  bg?: string;
};

export default function Badge({
  children,
  color = "#4ade80",
  bg = "rgba(74,222,128,0.12)",
}: BadgeProps) {
  return (
    <span
      style={{
        background: bg,
        color,
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}