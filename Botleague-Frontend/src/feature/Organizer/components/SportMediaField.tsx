import React from "react"
import { uploadSportMedia, clearSportMedia, type SportMediaSlot } from "../api/sportMedia.api"

function MiniSpinner({ size = 12, color = "#8c6cff" }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid rgba(75,134,232,0.15)", borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "org-media-field-spin 0.7s linear infinite", flexShrink: 0,
    }}>
      <style>{`@keyframes org-media-field-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}

// Single sport thumbnail/teaser-video slot — uploads immediately (independent
// of any surrounding form's Save button), previews, and allows removal.
// Colors are passed in by the host page so this renders correctly whether
// the host is dark or light themed — it has no theme of its own.
export default function SportMediaField({
  eventId,
  sportId,
  slot,
  kind,
  label,
  currentUrl,
  onMediaChange,
  colors = {},
}: {
  eventId: string
  sportId: string
  slot: SportMediaSlot
  kind: "image" | "video"
  label: string
  currentUrl?: string | null
  onMediaChange: () => void
  colors?: {
    border?: string
    muted?: string
    accent?: string
    danger?: string
    uploadBg?: string
  }
}) {
  const {
    border = "rgba(75,134,232,0.3)",
    muted = "#5d5d5d",
    accent = "#8c6cff",
    danger = "#e04b4b",
    uploadBg = "#f8f9ff",
  } = colors

  const [uploading, setUploading] = React.useState(false)
  const [fieldError, setFieldError] = React.useState<string | null>(null)

  const handleFile = async (file: File | null) => {
    if (!file) return
    setFieldError(null)
    setUploading(true)
    try {
      await uploadSportMedia(eventId, sportId, slot, file)
      onMediaChange()
    } catch (err: any) {
      setFieldError(err?.message || "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setFieldError(null)
    setUploading(true)
    try {
      await clearSportMedia(eventId, sportId, slot)
      onMediaChange()
    } catch (err: any) {
      setFieldError(err?.message || "Failed to remove.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ display: "block", fontSize: "0.62rem", color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </label>
      {currentUrl && (
        kind === "image"
          ? <img src={currentUrl} alt={label} style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${border}` }} />
          : <video src={currentUrl} controls style={{ width: "100%", maxHeight: "200px", borderRadius: "8px", border: `1px solid ${border}` }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{
          display: "flex", alignItems: "center", gap: "6px", cursor: uploading ? "not-allowed" : "pointer",
          background: uploadBg, border: `1px solid ${border}`, borderRadius: "8px",
          padding: "7px 14px", fontSize: "0.76rem", fontWeight: 600, color: muted, opacity: uploading ? 0.6 : 1,
        }}>
          {uploading ? <MiniSpinner color={accent} /> : null}
          {uploading ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
          <input
            type="file"
            accept={kind === "image" ? "image/*" : "video/*"}
            disabled={uploading}
            style={{ display: "none" }}
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {currentUrl && (
          <button type="button" onClick={handleRemove} disabled={uploading} style={{
            background: "rgba(224,75,75,0.1)", border: "1px solid rgba(224,75,75,0.25)", color: danger,
            borderRadius: "8px", padding: "7px 12px", fontSize: "0.76rem", fontWeight: 600,
            cursor: uploading ? "not-allowed" : "pointer",
          }}>
            Remove
          </button>
        )}
      </div>
      {fieldError && <div style={{ fontSize: "0.74rem", color: danger }}>{fieldError}</div>}
    </div>
  )
}
