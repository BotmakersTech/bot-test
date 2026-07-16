// Unified support-contact manager for event-level and sport-level contacts.
// Usage:  <SupportContactManager mode="event" eventId={eventId} />
//         <SupportContactManager mode="sport" eventId={eventId} sportId={sportId} />

import { useState, useEffect, useCallback } from "react"
import { Phone, Mail, User, Plus, X } from "lucide-react"
import {
  type SupportContactRecord, type SupportContactRequest,
  getSupportContacts, createSupportContact, updateSupportContact, deleteSupportContact,
} from "../api/organizer.api"

const ACCENT  = "#6d5bd0"
const CARD    = "rgba(0,0,0,0.02)"
const BORDER  = "rgba(75,134,232,0.28)"
const TEXT    = "#1f2430"
const MUTED   = "#6b7280"
const DANGER  = "#e04b4b"

interface ContactForm {
  name: string
  email: string
  phone: string
  roleLabel: string
}

const EMPTY_FORM: ContactForm = { name: "", email: "", phone: "", roleLabel: "" }

function ContactFormModal({
  title, initial, busy, error, onSave, onClose,
}: {
  title: string
  initial: ContactForm
  busy: boolean
  error: string | null
  onSave: (form: ContactForm) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ContactForm>(initial)

  function field(key: keyof ContactForm, label: string, placeholder?: string) {
    return (
      <div key={key}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</div>
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{ width: "100%", background: "#f8f9ff", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: TEXT, fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
        />
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: "16px", width: "100%", maxWidth: "420px", padding: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: TEXT }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {field("name", "Name *", "e.g. Registration Desk")}
          {field("roleLabel", "Role / Label", "e.g. Technical Support")}
          {field("email", "Email", "support@example.com")}
          {field("phone", "Phone", "+91 98765 43210")}
        </div>
        {error && (
          <div style={{ background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.22)", borderRadius: "8px", padding: "9px 12px", color: DANGER, fontSize: "0.78rem", marginTop: "14px" }}>{error}</div>
        )}
        <div style={{ display: "flex", gap: "10px", marginTop: "18px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.04)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.81rem", cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => !busy && form.name.trim() && onSave(form)}
            disabled={busy || !form.name.trim()}
            style={{ background: busy || !form.name.trim() ? "rgba(109,91,208,0.35)" : ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.81rem", fontWeight: 700, cursor: busy || !form.name.trim() ? "not-allowed" : "pointer" }}
          >{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  )
}

function ContactRow({ contact, onEdit, onDelete, deleting }: {
  contact: SupportContactRecord
  onEdit: (c: SupportContactRecord) => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 14px" }}>
      <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(109,91,208,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <User size={16} style={{ color: ACCENT }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.84rem", color: TEXT }}>{contact.name}</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "2px" }}>
          {contact.roleLabel && <span style={{ fontSize: "0.68rem", color: ACCENT, fontWeight: 600 }}>{contact.roleLabel}</span>}
          {contact.email && <span style={{ fontSize: "0.7rem", color: MUTED, display: "flex", alignItems: "center", gap: "3px" }}><Mail size={10} />{contact.email}</span>}
          {contact.phone && <span style={{ fontSize: "0.7rem", color: MUTED, display: "flex", alignItems: "center", gap: "3px" }}><Phone size={10} />{contact.phone}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <button onClick={() => onEdit(contact)} style={{ background: "rgba(0,0,0,0.04)", border: `1px solid ${BORDER}`, color: TEXT, borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", cursor: "pointer" }}>Edit</button>
        <button onClick={() => onDelete(contact.id)} disabled={deleting} style={{ background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.22)", color: DANGER, borderRadius: "6px", padding: "5px 8px", fontSize: "0.72rem", cursor: deleting ? "not-allowed" : "pointer" }}>
          {deleting ? "…" : "✕"}
        </button>
      </div>
    </div>
  )
}

export default function SupportContactManager({
  mode, eventId, sportId, title,
}: {
  mode: "event" | "sport"
  eventId: string
  sportId?: string
  title?: string
}) {
  const [contacts, setContacts]       = useState<SupportContactRecord[]>([])
  const [loading, setLoading]         = useState(false)
  const [err, setErr]                 = useState<string | null>(null)
  const [addOpen, setAddOpen]         = useState(false)
  const [editTarget, setEditTarget]   = useState<SupportContactRecord | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  const [actionBusy, setActionBusy]   = useState(false)
  const [actionErr, setActionErr]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (mode === "sport" && !sportId) return
    setLoading(true)
    setErr(null)
    try {
      const list = await getSupportContacts(eventId, mode === "sport" ? sportId : undefined)
      setContacts(list)
    } catch {
      setErr("Failed to load support contacts.")
    } finally {
      setLoading(false)
    }
  }, [mode, eventId, sportId])

  useEffect(() => { load() }, [load])

  function toRequest(form: ContactForm): SupportContactRequest {
    return {
      eventSportId: mode === "sport" ? sportId : undefined,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      roleLabel: form.roleLabel.trim() || null,
    }
  }

  async function handleAdd(form: ContactForm) {
    setActionBusy(true); setActionErr(null)
    try {
      const created = await createSupportContact(eventId, toRequest(form))
      setContacts(prev => [...prev, created])
      setAddOpen(false)
    } catch {
      setActionErr("Failed to add contact.")
    } finally {
      setActionBusy(false)
    }
  }

  async function handleUpdate(form: ContactForm) {
    if (!editTarget) return
    setActionBusy(true); setActionErr(null)
    try {
      const updated = await updateSupportContact(eventId, editTarget.id, toRequest(form))
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
      setEditTarget(null)
    } catch {
      setActionErr("Failed to update contact.")
    } finally {
      setActionBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id); setActionErr(null)
    try {
      await deleteSupportContact(eventId, id)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch {
      setActionErr("Failed to delete contact.")
    } finally {
      setDeletingId(null)
    }
  }

  function toForm(c: SupportContactRecord): ContactForm {
    return { name: c.name, email: c.email ?? "", phone: c.phone ?? "", roleLabel: c.roleLabel ?? "" }
  }

  const headingText = title ?? (mode === "event" ? "Support Contacts" : "Sport Support Contacts")

  return (
    <div style={{ background: "#fff", border: `1.5px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", marginTop: "24px" }}>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, background: "rgba(109,91,208,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.85rem", color: TEXT }}>📞 {headingText.toUpperCase()}</div>
        <button
          onClick={() => { setActionErr(null); setAddOpen(true) }}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(109,91,208,0.1)", border: "1px solid rgba(109,91,208,0.3)", color: ACCENT, borderRadius: "8px", padding: "7px 14px", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}
        ><Plus size={13} /> Add Contact</button>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {loading && <div style={{ color: MUTED, fontSize: "0.83rem", padding: "12px 0" }}>Loading…</div>}
        {err && <div style={{ color: DANGER, fontSize: "0.83rem", marginBottom: "10px" }}>{err}</div>}
        {!loading && contacts.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", color: MUTED, fontSize: "0.82rem" }}>
            No support contacts yet.
          </div>
        )}
        {actionErr && (
          <div style={{ background: "rgba(224,75,75,0.08)", border: "1px solid rgba(224,75,75,0.22)", borderRadius: "8px", padding: "8px 12px", color: DANGER, fontSize: "0.78rem", marginBottom: "12px" }}>{actionErr}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {contacts.map(c => (
            <ContactRow key={c.id} contact={c} onEdit={ct => { setActionErr(null); setEditTarget(ct) }} onDelete={handleDelete} deleting={deletingId === c.id} />
          ))}
        </div>
      </div>

      {addOpen && (
        <ContactFormModal title="Add Support Contact" initial={EMPTY_FORM} busy={actionBusy} error={actionErr}
          onSave={handleAdd} onClose={() => { setAddOpen(false); setActionErr(null) }} />
      )}
      {editTarget && (
        <ContactFormModal title="Edit Support Contact" initial={toForm(editTarget)} busy={actionBusy} error={actionErr}
          onSave={handleUpdate} onClose={() => { setEditTarget(null); setActionErr(null) }} />
      )}
    </div>
  )
}
