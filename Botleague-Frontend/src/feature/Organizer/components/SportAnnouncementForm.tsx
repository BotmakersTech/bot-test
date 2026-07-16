import React from "react"
import { Send, Paperclip, X, Check } from "lucide-react"
import { sendSportAnnouncement, getAnnouncementAttachmentUploadUrl, type SportAnnounceRequest } from "../api/organizer.api"
import { validateMediaFile } from "../api/eventMedia.api"

const BORDER  = "rgba(75,134,232,0.28)"
const ACCENT  = "#6d5bd0"
const TEXT    = "#1f2430"
const MUTED   = "#6b7280"
const SUCCESS = "#1fa952"
const DANGER  = "#e04b4b"

interface TeamOption {
  teamId: string
  teamName: string
  robotName?: string
}

export default function SportAnnouncementForm({
  eventId,
  sportId,
  teams,
  onClose,
  onSent,
}: {
  eventId: string
  sportId: string
  teams: TeamOption[]
  onClose: () => void
  onSent: () => void
}) {
  const [method, setMethod] = React.useState<"ALL" | "SPECIFIC_TEAMS">("ALL")
  const [selectedTeamIds, setSelectedTeamIds] = React.useState<Set<string>>(new Set())
  const [message, setMessage] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  const handleFilePick = (f: File | null) => {
    setError(null)
    if (!f) { setFile(null); return }
    const err = validateMediaFile(f)
    if (err) { setError(err); return }
    setFile(f)
  }

  const handleSend = async () => {
    setError(null)
    setSuccess(null)
    if (!message.trim()) { setError("Write a message before sending."); return }
    if (method === "SPECIFIC_TEAMS" && selectedTeamIds.size === 0) {
      setError("Select at least one participant."); return
    }

    setSending(true)
    try {
      let attachmentKey: string | undefined
      let attachmentUrl: string | undefined
      let attachmentFileType: string | undefined

      if (file) {
        setUploading(true)
        const { uploadUrl, fileUrl, key } = await getAnnouncementAttachmentUploadUrl(eventId, sportId, file.type, file.size)
        await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
        attachmentKey = key
        attachmentUrl = fileUrl
        attachmentFileType = file.type
        setUploading(false)
      }

      const req: SportAnnounceRequest = {
        message: message.trim(),
        targetType: method,
        teamIds: method === "SPECIFIC_TEAMS" ? Array.from(selectedTeamIds) : undefined,
        attachmentKey, attachmentUrl, attachmentFileType,
      }
      await sendSportAnnouncement(eventId, sportId, req)

      setSuccess("Announcement sent.")
      setMessage("")
      setFile(null)
      setSelectedTeamIds(new Set())
      onSent()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Failed to send announcement")
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.62rem", color: MUTED, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px",
  }

  return (
    <div style={{
      background: "#ffffff",
      border: `1.5px solid ${BORDER}`,
      borderRadius: "16px",
      padding: "18px 20px",
      marginBottom: "28px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: TEXT, display: "flex", alignItems: "center", gap: "8px" }}>
          <Send size={16} style={{ color: ACCENT }} /> Send Announcement
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      {/* Method toggle */}
      <div style={{ marginBottom: "14px" }}>
        <div style={labelStyle}>Send to</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setMethod("ALL")}
            style={{
              flex: 1, padding: "9px 14px", borderRadius: "9px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
              background: method === "ALL" ? "rgba(109,91,208,0.12)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${method === "ALL" ? ACCENT : BORDER}`,
              color: method === "ALL" ? ACCENT : MUTED,
            }}
          >
            All registered participants
          </button>
          <button
            type="button"
            onClick={() => setMethod("SPECIFIC_TEAMS")}
            style={{
              flex: 1, padding: "9px 14px", borderRadius: "9px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
              background: method === "SPECIFIC_TEAMS" ? "rgba(109,91,208,0.12)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${method === "SPECIFIC_TEAMS" ? ACCENT : BORDER}`,
              color: method === "SPECIFIC_TEAMS" ? ACCENT : MUTED,
            }}
          >
            Specific participants
          </button>
        </div>
      </div>

      {/* Specific participant picker */}
      {method === "SPECIFIC_TEAMS" && (
        <div style={{ marginBottom: "14px" }}>
          <div style={labelStyle}>Select participants ({selectedTeamIds.size} selected)</div>
          {teams.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: MUTED, padding: "8px 0" }}>No registered teams yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "220px", overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: "9px", padding: "8px" }}>
              {teams.map(t => (
                <label key={t.teamId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "6px", cursor: "pointer", background: selectedTeamIds.has(t.teamId) ? "rgba(109,91,208,0.06)" : "transparent" }}>
                  <input type="checkbox" checked={selectedTeamIds.has(t.teamId)} onChange={() => toggleTeam(t.teamId)} />
                  <span style={{ fontSize: "0.82rem", color: TEXT, fontWeight: 600 }}>{t.teamName}</span>
                  {t.robotName && <span style={{ fontSize: "0.72rem", color: MUTED }}>— {t.robotName}</span>}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message */}
      <div style={{ marginBottom: "14px" }}>
        <div style={labelStyle}>Message</div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          placeholder="Write your announcement…"
          style={{ width: "100%", background: "#f8f9ff", border: `1px solid ${BORDER}`, borderRadius: "8px", color: TEXT, padding: "10px 12px", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", resize: "vertical" }}
        />
      </div>

      {/* Attachment */}
      <div style={{ marginBottom: "16px" }}>
        <div style={labelStyle}>Attachment (optional — image or video)</div>
        {file ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: TEXT }}>
            <Paperclip size={14} style={{ color: ACCENT }} /> {file.name}
            <button type="button" onClick={() => handleFilePick(null)} style={{ background: "none", border: "none", color: DANGER, cursor: "pointer", fontSize: "0.75rem" }}>Remove</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.03)", border: `1px dashed ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "8px 14px", fontSize: "0.78rem", cursor: "pointer" }}
          >
            <Paperclip size={13} /> Attach a file
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }}
          onChange={e => { handleFilePick(e.target.files?.[0] ?? null); e.target.value = "" }} />
      </div>

      {error && (
        <div style={{ background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.22)", borderRadius: "8px", padding: "9px 12px", color: DANGER, fontSize: "0.8rem", marginBottom: "12px" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(31,169,82,0.08)", border: "1px solid rgba(31,169,82,0.22)", borderRadius: "8px", padding: "9px 12px", color: SUCCESS, fontSize: "0.8rem", marginBottom: "12px" }}>
          <Check size={14} /> {success}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: sending ? "rgba(109,91,208,0.4)" : ACCENT, border: "none", color: "#fff",
            borderRadius: "9px", padding: "10px 22px", fontSize: "0.82rem", fontWeight: 700,
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          <Send size={14} /> {uploading ? "Uploading…" : sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  )
}
