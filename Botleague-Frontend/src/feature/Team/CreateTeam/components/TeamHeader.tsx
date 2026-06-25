// components/TeamHeader.tsx

export default function TeamHeader() {

  return (

    <div style={{ marginBottom: "28px" }}>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "6px",
        }}
      >

        <div
          style={{
            width: "4px",
            height: "34px",
            background:
              "linear-gradient(to bottom, #fa4715, #f97316)",
            borderRadius: "2px",
          }}
        />

        <h1
          style={{
            margin: 0,
            fontSize: "1.9rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#ffffff",
          }}
        >
          CREATE TEAM
        </h1>
      </div>

      <p
        style={{
          margin: "0 0 0 16px",
          color: "#d1d5db",
          fontSize: "0.85rem",
        }}
      >
        Fill in the details to register your team
      </p>
    </div>
  );
}