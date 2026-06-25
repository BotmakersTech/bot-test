import React, { useEffect, useState } from "react"
import { Shield, Phone, Mail, User, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { getMyGuardian, saveGuardian, type GuardianInfo } from "../api/eligibility.api"

const CARD    = "rgba(0,0,0,0.25)"
const BORDER  = "rgba(255,255,255,0.08)"
const MUTED   = "#9ca3af"
const TEXT    = "#ffffff"
const ACCENT  = "#fa4715"
const SUCCESS = "#4ade80"
const DANGER  = "#f87171"
const WARN    = "#fbbf24"

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "11px 14px",
  color: TEXT,
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box",
}

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  color: MUTED,
  fontSize: "0.75rem",
  fontWeight: 600,
  marginBottom: "6px",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
}

const RELATIONSHIPS = [
  "Father", "Mother", "Parent",
  "Grandfather", "Grandmother",
  "Uncle", "Aunt",
  "Elder Sibling",
  "Legal Guardian",
  "Other",
]

interface GuardianFormProps {
  onSaved?: () => void
}

export default function GuardianForm({ onSaved }: GuardianFormProps) {
  const [form, setForm] = useState<GuardianInfo>({
    guardianName: "",
    relationship: "",
    mobileNumber: "",
    email: "",
    emergencyContact: "",
  })
  const [loaded, setLoaded]   = useState(false)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    getMyGuardian()
      .then(g => {
        if (g) {
          setForm({
            guardianName:     g.guardianName,
            relationship:     g.relationship,
            mobileNumber:     g.mobileNumber,
            email:            g.email ?? "",
            emergencyContact: g.emergencyContact,
          })
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const set = (k: keyof GuardianInfo, v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      await saveGuardian(form)
      setSuccess(true)
      onSaved?.()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to save guardian info")
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: MUTED, fontSize: "0.85rem" }}>
        <Loader2 size={15} className="animate-spin" /> Loading guardian info…
      </div>
    )
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <Shield size={18} color={WARN} />
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: TEXT }}>
          Guardian Information
        </h3>
      </div>
      <p style={{ margin: "0 0 20px", color: MUTED, fontSize: "0.8rem" }}>
        Required for participants under 18. Your guardian's details will be kept confidential.
      </p>

      {/* Notice banner */}
      <div style={{
        background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
        borderRadius: "10px", padding: "10px 14px", marginBottom: "20px",
        display: "flex", alignItems: "flex-start", gap: "10px"
      }}>
        <AlertCircle size={15} color={WARN} style={{ marginTop: "1px", flexShrink: 0 }} />
        <span style={{ color: WARN, fontSize: "0.78rem", fontWeight: 500 }}>
          Without a completed guardian profile, registration for events will be blocked.
        </span>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>

        {/* Name */}
        <div>
          <label style={LABEL_STYLE}>Guardian Full Name *</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0 12px" }}>
            <User size={14} color={MUTED} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="e.g. Rajesh Kumar"
              value={form.guardianName}
              onChange={e => set("guardianName", e.target.value)}
              style={{ ...INPUT_STYLE, background: "transparent", border: "none", padding: "11px 0" }}
            />
          </div>
        </div>

        {/* Relationship */}
        <div>
          <label style={LABEL_STYLE}>Relationship *</label>
          <select
            value={form.relationship}
            onChange={e => set("relationship", e.target.value)}
            style={{ ...INPUT_STYLE, appearance: "none", cursor: "pointer" }}
          >
            <option value="">Select relationship…</option>
            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Mobile + Emergency in a row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={LABEL_STYLE}>Mobile Number *</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0 12px" }}>
              <Phone size={14} color={MUTED} style={{ flexShrink: 0 }} />
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={form.mobileNumber}
                onChange={e => set("mobileNumber", e.target.value)}
                style={{ ...INPUT_STYLE, background: "transparent", border: "none", padding: "11px 0" }}
              />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Emergency Contact *</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0 12px" }}>
              <Phone size={14} color={MUTED} style={{ flexShrink: 0 }} />
              <input
                type="tel"
                placeholder="Alternate number"
                value={form.emergencyContact}
                onChange={e => set("emergencyContact", e.target.value)}
                style={{ ...INPUT_STYLE, background: "transparent", border: "none", padding: "11px 0" }}
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={LABEL_STYLE}>Guardian Email</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0 12px" }}>
            <Mail size={14} color={MUTED} style={{ flexShrink: 0 }} />
            <input
              type="email"
              placeholder="guardian@email.com"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              style={{ ...INPUT_STYLE, background: "transparent", border: "none", padding: "11px 0" }}
            />
          </div>
        </div>

        {/* Feedback */}
        {success && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: SUCCESS, fontSize: "0.82rem", fontWeight: 600 }}>
            <CheckCircle2 size={15} /> Guardian info saved successfully.
          </div>
        )}
        {error && (
          <div style={{ color: DANGER, fontSize: "0.82rem", fontWeight: 600 }}>⚠ {error}</div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !form.guardianName || !form.relationship || !form.mobileNumber || !form.emergencyContact}
          style={{
            background: ACCENT,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "12px 20px",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            alignSelf: "flex-start",
          }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : "Save Guardian Info"}
        </button>
      </div>
    </div>
  )
}
