import React from "react"
import { uploadEventMedia, clearEventMedia, type EventMediaSlot } from "../api/eventMedia.api"

function MiniSpinner({ size = 12, color = "#fa4715" }: { size?: number; color?: string }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid rgba(255,255,255,0.12)", borderTop: `2px solid ${color}`,
      borderRadius: "50%", animation: "org-media-field-spin 0.7s linear infinite", flexShrink: 0,
    }}>
      <style>{`@keyframes org-media-field-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}

// Single event thumbnail/teaser-video slot: pick a file, upload immediately
// (independent of any surrounding form's Save button), preview, and allow
// removal. Colors are passed in by the host page so this renders correctly
// whether the host is dark or light themed — it has no theme of its own.
export default function EventMediaField({
  eventId,
  slot,
  kind,
  label,
  currentUrl,
  onMediaChange,
  colors = {},
}: {
  eventId: string
  slot: EventMediaSlot
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
    border = "rgba(255,255,255,0.08)",
    muted = "#9ca3af",
    accent = "#fa4715",
    danger = "#f87171",
    uploadBg = "rgba(255,255,255,0.06)",
  } = colors

  const [uploading, setUploading] = React.useState(false)
  const [fieldError, setFieldError] = React.useState<string | null>(null)

  const handleFile = async (file: File | null) => {
    if (!file) return
    setFieldError(null)
    setUploading(true)
    try {
      await uploadEventMedia(eventId, slot, file)
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
      await clearEventMedia(eventId, slot)
      onMediaChange()
    } catch (err: any) {
      setFieldError(err?.message || "Failed to remove.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: muted }}>
        {label}
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: danger,
              borderRadius: "8px", padding: "7px 12px", fontSize: "0.76rem", fontWeight: 600,
              cursor: uploading ? "not-allowed" : "pointer",
            }}>
              Remove
            </button>
          )}
        </div>
        {fieldError && <div style={{ fontSize: "0.74rem", color: danger }}>{fieldError}</div>}
      </div>
    </div>
  )
}
