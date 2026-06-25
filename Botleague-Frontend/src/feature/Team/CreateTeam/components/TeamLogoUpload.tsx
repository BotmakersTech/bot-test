// components/TeamLogoUpload.tsx

import { FiUploadCloud } from "react-icons/fi";

type Props = {
  logoPreview: string;
  onUpload: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
};

export default function TeamLogoUpload({
  logoPreview,
  onUpload,
}: Props) {

  return (

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginBottom: "28px",
        padding: "18px 22px",
        background: "rgba(0,0,0,0.2)",
        border:
          "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
      }}
    >

      <div
        style={{
          position: "relative",
        }}
      >

        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",

            background: logoPreview
              ? `url(${logoPreview}) center/cover no-repeat`
              : "linear-gradient(135deg, #fa4715, #f97316)",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >

          {!logoPreview && (
            <FiUploadCloud
              size={30}
              color="#fff"
            />
          )}
        </div>

        <label
          style={{
            position: "absolute",
            bottom: "0",
            right: "0",

            width: "20px",
            height: "20px",

            borderRadius: "50%",

            background: "#ff4d4d",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            cursor: "pointer",
          }}
        >

          ✏️

          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            style={{
              display: "none",
            }}
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
  );
}