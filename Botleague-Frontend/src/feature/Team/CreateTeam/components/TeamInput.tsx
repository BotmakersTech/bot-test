// components/TeamInput.tsx

type Props = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
};

export default function TeamInput({
  label,
  name,
  value,
  placeholder,
  focused,
  onFocus,
  onBlur,
  onChange,
}: Props) {

  return (

    <div>

      <div
        style={{
          fontSize: "0.7rem",
          color: "#e5e7eb",
          fontWeight: 600,
          letterSpacing: "0.08em",
          marginBottom: "6px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <input
        name={name}
        placeholder={placeholder}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
        style={{
          width: "100%",
          background:
            focused
              ? "rgba(0,0,0,0.45)"
              : "rgba(0,0,0,0.28)",

          border:
            focused
              ? "1px solid #fa4715"
              : "1px solid rgba(255,255,255,0.15)",

          borderRadius: "9px",

          padding: "12px 14px 12px 20px",

          color: "#ffffff",

          fontSize: "0.88rem",

          outline: "none",

          transition: "all 0.2s ease",

          boxSizing: "border-box",
        }}
      />
    </div>
  );
}