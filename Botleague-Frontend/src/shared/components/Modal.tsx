import React from "react";


// ======================================================
// TYPES
// ======================================================

interface ModalProps {

  title: string;

  onClose: () => void;

  children: React.ReactNode;
}


// ======================================================
// COMPONENT
// ======================================================

export default function Modal({

  title,

  onClose,

  children,

}: ModalProps) {

  return (

    <div
      style={{
        position: "fixed",

        inset: 0,

        background:
          "rgba(0,0,0,0.75)",

        backdropFilter: "blur(6px)",

        zIndex: 1000,

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "16px",
      }}
      onClick={(e) =>
        e.target === e.currentTarget &&
        onClose()
      }
    >

      <div
        style={{
          background:
            "linear-gradient(145deg, #2e2e2e, #1e1e1e)",

          border:
            "1px solid rgba(255,255,255,0.1)",

          borderRadius: "24px",

          padding: "32px",

          width: "100%",

          maxWidth: "480px",

          boxShadow:
            "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >

        {/* HEADER */}

        <div
          className="flex items-center justify-between"
          style={{
            marginBottom: "24px",
          }}
        >

          <h2
            style={{
              fontSize: "1.4rem",

              fontWeight: 700,

              color: "#fff",
            }}
          >
            {title}
          </h2>

          <button
            onClick={onClose}
            style={{
              background:
                "rgba(255,255,255,0.08)",

              border: "none",

              color: "#9ca3af",

              width: "36px",

              height: "36px",

              borderRadius: "50%",

              cursor: "pointer",

              fontSize: "1.1rem",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",
            }}
          >
            ✕
          </button>

        </div>

        {/* CONTENT */}

        {children}

      </div>

    </div>
  );
}