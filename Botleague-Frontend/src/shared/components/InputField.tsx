import React from "react";


// ======================================================
// TYPES
// ======================================================

interface InputFieldProps {

  label: string;

  placeholder?: string;

  value: string;

  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  type?: string;
}


// ======================================================
// COMPONENT
// ======================================================

export default function InputField({

  label,

  placeholder,

  value,

  onChange,

  type = "text",

}: InputFieldProps) {

  return (

    <div
      style={{
        marginBottom: "16px",
      }}
    >

      <label
        style={{
          display: "block",

          color: "#9ca3af",

          fontSize: "0.8rem",

          fontWeight: 600,

          marginBottom: "8px",

          letterSpacing: "0.05em",

          textTransform: "uppercase",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",

          background:
            "rgba(0,0,0,0.3)",

          border:
            "1px solid rgba(255,255,255,0.1)",

          borderRadius: "12px",

          padding: "12px 16px",

          color: "#fff",

          fontSize: "0.95rem",

          outline: "none",

          boxSizing: "border-box",

          transition:
            "border-color 0.2s",
        }}
        onFocus={(e) =>
          (e.target.style.borderColor =
            "rgba(250,71,21,0.5)")
        }
        onBlur={(e) =>
          (e.target.style.borderColor =
            "rgba(255,255,255,0.1)")
        }
      />

    </div>
  );
}