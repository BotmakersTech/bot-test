type Props = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export default function SectionCard({
  children,
  style = {},
  className = "",
}: Props) {
  return (
    <div
      className={className}
      style={{
        background: "#343434",
        border:
          "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}