type Props = {
  children: React.ReactNode;
  action?: React.ReactNode;
};

export default function SectionTitle({
  children,
  action,
}: Props) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ marginBottom: "20px" }}
    >
      <h3
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "0.03em",
          fontFamily:
            "'Orbitron', sans-serif",
        }}
      >
        {children}
      </h3>

      {action}
    </div>
  );
}