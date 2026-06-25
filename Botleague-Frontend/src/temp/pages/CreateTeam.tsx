import { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";

export default function CreateTeam() {
  const [form, setForm] = useState({
    teamName: "",
    description: "",
    institutionName: "",
    city: "",
    state: "",
    country: "",
  });

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setLogoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const handleSubmit = async () => {
    const data = new FormData();

    data.append("teamName", form.teamName);
    data.append("description", form.description);
    data.append("institutionName", form.institutionName);
    data.append("city", form.city);
    data.append("state", form.state);
    data.append("country", form.country);

    if (logoFile) {
      data.append("logo", logoFile);
    }

    console.log([...data.entries()]);

    // Example API call
    // await fetch("/api/team", {
    //   method: "POST",
    //   body: data,
    // });
  };

  const fields = [
    {
      name: "teamName",
      placeholder: "Team Name",
      col: "col-span-2 md:col-span-1",
    },
    {
      name: "description",
      placeholder: "Description",
      col: "col-span-2 md:col-span-1",
    },
    {
      name: "institutionName",
      placeholder: "Institution Name",
      col: "col-span-2 md:col-span-1",
    },
    {
      name: "city",
      placeholder: "City",
      col: "col-span-2 md:col-span-1",
    },
    {
      name: "state",
      placeholder: "State",
      col: "col-span-2 md:col-span-1",
    },
    {
      name: "country",
      placeholder: "Country",
      col: " col-span-2 md:col-span-1",
    },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "#434343",
        padding: "36px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
     

      {/* Subtle dark glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,0,0,0.35) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* HEADER */}
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
                boxShadow: "0 0 10px rgba(250,71,21,0.6)",
              }}
            />

            <h1
              style={{
                margin: 0,
                fontSize: "1.9rem",
                fontFamily: "'Orbitron', sans-serif",
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
            Fill in the details to register your team in the league
          </p>
        </div>

        {/* LOGO ROW */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "28px",
            padding: "18px 22px",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: logoPreview
                  ? `url(${logoPreview}) center/cover no-repeat`
                  : "linear-gradient(135deg, #fa4715, #f97316)",
                border: "2px solid rgba(250,71,21,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.7rem",
                boxShadow: "0 0 20px rgba(250,71,21,0.3)",
              }}
            >
             {!logoPreview && <FiUploadCloud size={30} color="#fff" />}
            </div>

            {/* Upload Button */}
            <label
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#ff4d4d",
                border: "2px solid #434343",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                cursor: "pointer",
              }}
            >
              ✏️

              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div>
            <div
              style={{
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.95rem",
                marginBottom: "3px",
              }}
            >
              Team Logo
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: "0.8rem",
              }}
            >
              Upload your team logo image
            </div>
          </div>
        </div>

        {/* SECTION LABEL */}
        <div style={{ marginBottom: "14px" }}>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#fa4715",
              textTransform: "uppercase",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            Team Details
          </span>
        </div>

        {/* FORM GRID */}
        <div className="grid grid-cols-2 gap-4">
          {fields.map(({ name, placeholder, col }) => (
            <div key={name} className={col}>
              {/* Label */}
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
                {placeholder}
              </div>

              {/* Input */}
              <div style={{ position: "relative" }}>
                <input
                  name={name}
                  placeholder={`Enter ${placeholder.toLowerCase()}...`}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  onFocus={() => setFocused(name)}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: "100%",
                    background:
                      focused === name
                        ? "rgba(0,0,0,0.45)"
                        : "rgba(0,0,0,0.28)",

                    border:
                      focused === name
                        ? "1px solid #fa4715"
                        : "1px solid rgba(255,255,255,0.15)",

                    borderRadius: "9px",
                    padding: "12px 14px 12px 20px",
                    color: "#ffffff",
                    fontSize: "0.88rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box",

                    boxShadow:
                      focused === name
                        ? "0 0 0 3px rgba(250,71,21,0.15)"
                        : "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: "32px",
            paddingTop: "22px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
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
            onClick={handleSubmit}
            style={{
              background:
                "linear-gradient(135deg, #ff4d4d 0%, #fa4715 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              padding: "12px 38px",
              fontSize: "0.9rem",
              fontWeight: 700,
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "0.08em",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,77,77,0.4)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 28px rgba(255,77,77,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(255,77,77,0.4)";
            }}
          >
            CREATE TEAM
          </button>
        </div>
      </div>
    </div>
  );
}