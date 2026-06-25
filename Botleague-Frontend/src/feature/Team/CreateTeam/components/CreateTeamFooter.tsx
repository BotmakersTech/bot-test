// components/CreateTeamFooter.tsx

type Props = {
  onSubmit: () => void;
};

export default function CreateTeamFooter({
  onSubmit,
}: Props) {

  return (

    <div
      style={{
        marginTop: "32px",
        paddingTop: "22px",

        borderTop:
          "1px solid rgba(255,255,255,0.1)",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >

      <span
        style={{
          color: "#9ca3af",
          fontSize: "0.78rem",
        }}
      >
        * All fields are required
      </span>

      <button
        onClick={onSubmit}
        style={{
          background:
            "linear-gradient(135deg, #ff4d4d 0%, #fa4715 100%)",

          color: "#fff",

          border: "none",

          borderRadius: "9px",

          padding: "12px 38px",

          fontSize: "0.9rem",

          fontWeight: 700,

          cursor: "pointer",
        }}
      >
        CREATE TEAM
      </button>
    </div>
  );
}