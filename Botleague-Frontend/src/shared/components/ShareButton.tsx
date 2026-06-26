import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface Props {
  url: string;           // full share URL
  label?: string;        // e.g. "Share Profile"
  size?: "sm" | "md";
}

export default function ShareButton({ url, label = "Share", size = "md" }: Props) {
  const [copied, setCopied] = useState(false);
  const [open,   setOpen]   = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const pad = size === "sm" ? "6px 12px" : "9px 18px";
  const fs  = size === "sm" ? "0.75rem"  : "0.85rem";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: pad, borderRadius: 9,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#e4e4e7", fontSize: fs, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"}
      >
        <Share2 size={size === "sm" ? 13 : 15} /> {label}
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />

          {/* dropdown */}
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50,
            background: "#1a1a1d", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: 14, minWidth: 280,
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.65rem", color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Share link
            </p>

            {/* URL display */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "8px 10px",
            }}>
              <span style={{ flex: 1, fontSize: "0.75rem", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url}
              </span>
              <button
                onClick={copy}
                style={{
                  flexShrink: 0, padding: "4px 10px", borderRadius: 6,
                  background: copied ? "rgba(74,222,128,0.15)" : "#fa4715",
                  border: copied ? "1px solid rgba(74,222,128,0.3)" : "none",
                  color: copied ? "#4ade80" : "#fff",
                  fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                  transition: "all 0.2s", fontFamily: "inherit",
                }}
              >
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
