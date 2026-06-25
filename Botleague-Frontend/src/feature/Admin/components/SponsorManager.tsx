// Unified sponsor manager for event-level and sport-level sponsors.
// Usage:  <SponsorManager mode="event" entityId={eventId} title="Event Sponsors" />
//         <SponsorManager mode="sport"  entityId={sportId} title="Sport Sponsors" />

import { useRef, useState, useEffect, useCallback } from "react";
import {
  EVENT_SPORT_SPONSOR_TYPES,
  type EventSponsor,
  getEventSponsors,
  addEventSponsor,
  updateEventSponsor,
  deleteEventSponsor,
  getEventSponsorLogoUploadUrl,
} from "../../Event/api/eventSponsor.api";
import {
  type SportSponsor,
  getSportSponsors,
  addSportSponsor,
  updateSportSponsor,
  deleteSportSponsor,
  getSportSponsorLogoUploadUrl,
} from "../../Event/api/sportSponsor.api";
import SponsorStrip, { type SponsorEntry } from "../../../shared/components/SponsorStrip";

// ─── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT  = "#fa4715";
const CARD    = "rgba(0,0,0,0.25)";
const CARD2   = "rgba(0,0,0,0.35)";
const BORDER  = "rgba(255,255,255,0.08)";
const TEXT    = "#ffffff";
const MUTED   = "#9ca3af";
const LABEL   = "#e5e7eb";
const DANGER  = "#f87171";

type Sponsor = EventSponsor | SportSponsor;

interface SponsorForm {
  sponsorName: string;
  sponsorType: string;
  website: string;
  logoUrl: string;
  displayOrder: string;
}

const EMPTY_FORM: SponsorForm = {
  sponsorName: "", sponsorType: "", website: "", logoUrl: "", displayOrder: "",
};

// ─── Logo uploader ──────────────────────────────────────────────────────────────
interface LogoUploadProps {
  mode: "event" | "sport";
  entityId: string;
  value: string;
  onChange: (url: string) => void;
}

function LogoUploader({ mode, entityId, value, onChange }: LogoUploadProps) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [preview, setPreview]     = useState(value);

  useEffect(() => { setPreview(value); }, [value]);

  async function handleFile(file: File) {
    setUploadErr(null);
    setUploading(true);
    try {
      const getUrl = mode === "event"
        ? getEventSponsorLogoUploadUrl(entityId, file.type, file.size)
        : getSportSponsorLogoUploadUrl(entityId, file.type, file.size);
      const { uploadUrl, fileUrl } = await getUrl;
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setPreview(fileUrl);
      onChange(fileUrl);
    } catch {
      setUploadErr("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div style={{ fontSize: "0.67rem", fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Logo</div>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        {preview ? (
          <div style={{ position: "relative" }}>
            <img src={preview} alt="logo" style={{ height: "52px", maxWidth: "90px", objectFit: "contain", borderRadius: "8px", border: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.3)", padding: "4px" }} />
            <button
              type="button"
              onClick={() => { setPreview(""); onChange(""); }}
              style={{ position: "absolute", top: "-6px", right: "-6px", background: "rgba(248,113,113,0.9)", border: "none", color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >✕</button>
          </div>
        ) : (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            style={{ width: "90px", height: "52px", border: `1px dashed ${uploading ? ACCENT : BORDER}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer", background: "rgba(0,0,0,0.2)", fontSize: "0.65rem", color: MUTED, flexDirection: "column", gap: "3px" }}
          >
            {uploading ? <span style={{ fontSize: "0.6rem", color: ACCENT }}>Uploading…</span> : <><span style={{ fontSize: "1rem" }}>📁</span><span>Upload</span></>}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        {!preview && (
          <div style={{ flex: 1 }}>
            <input
              type="url"
              placeholder="or paste logo URL…"
              value={value.startsWith("http") && !preview ? value : ""}
              onChange={e => { onChange(e.target.value); setPreview(e.target.value); }}
              style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", color: TEXT, fontSize: "0.78rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}
      </div>
      {uploadErr && <div style={{ color: DANGER, fontSize: "0.7rem", marginTop: "4px" }}>{uploadErr}</div>}
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────────
interface ModalProps {
  mode: "event" | "sport";
  entityId: string;
  title: string;
  initial: SponsorForm;
  busy: boolean;
  error: string | null;
  onSave: (form: SponsorForm) => void;
  onClose: () => void;
}

function SponsorFormModal({ mode, entityId, title, initial, busy, error, onSave, onClose }: ModalProps) {
  const [form, setForm] = useState<SponsorForm>(initial);

  function field(key: keyof SponsorForm, label: string, placeholder?: string) {
    return (
      <div key={key}>
        <div style={{ fontSize: "0.67rem", fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: TEXT, fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#2a2a2a", border: `1px solid rgba(250,71,21,0.2)`, borderRadius: "16px", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflow: "auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: TEXT }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {field("sponsorName", "Name *", "e.g. Red Bull")}

          <div>
            <div style={{ fontSize: "0.67rem", fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Type</div>
            <select
              value={form.sponsorType}
              onChange={e => setForm(f => ({ ...f, sponsorType: e.target.value }))}
              style={{ width: "100%", background: "#2a2a2a", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: form.sponsorType ? TEXT : MUTED, fontSize: "0.82rem", outline: "none" }}
            >
              <option value="">Select type…</option>
              {EVENT_SPORT_SPONSOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {field("website", "Website", "https://example.com")}

          <LogoUploader
            mode={mode}
            entityId={entityId}
            value={form.logoUrl}
            onChange={url => setForm(f => ({ ...f, logoUrl: url }))}
          />

          {field("displayOrder", "Display Order", "0 = first")}
        </div>

        {error && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "10px 12px", color: DANGER, fontSize: "0.78rem", fontWeight: 600, marginTop: "16px" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.81rem", cursor: "pointer" }}
          >Cancel</button>
          <button
            onClick={() => !busy && form.sponsorName.trim() && onSave(form)}
            disabled={busy || !form.sponsorName.trim()}
            style={{ background: busy || !form.sponsorName.trim() ? "rgba(250,71,21,0.25)" : ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.81rem", fontWeight: 700, cursor: busy || !form.sponsorName.trim() ? "not-allowed" : "pointer" }}
          >{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sponsor row ────────────────────────────────────────────────────────────────
interface SponsorRowProps {
  sponsor: Sponsor;
  onEdit: (s: Sponsor) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function SponsorRow({ sponsor, onEdit, onDelete, deleting }: SponsorRowProps) {
  const [logoErr, setLogoErr] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 14px",
    }}>
      {sponsor.logoUrl && !logoErr ? (
        <img src={sponsor.logoUrl} alt={sponsor.sponsorName} onError={() => setLogoErr(true)} style={{ height: "36px", width: "48px", objectFit: "contain", borderRadius: "6px", background: "rgba(0,0,0,0.2)", flexShrink: 0 }} />
      ) : (
        <div style={{ width: "48px", height: "36px", background: "rgba(0,0,0,0.25)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: MUTED, flexShrink: 0 }}>LOGO</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sponsor.sponsorName}</div>
        {sponsor.sponsorType && <div style={{ fontSize: "0.65rem", color: ACCENT, fontWeight: 600 }}>{sponsor.sponsorType}</div>}
      </div>
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <button onClick={() => onEdit(sponsor)} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", cursor: "pointer" }}>Edit</button>
        <button onClick={() => onDelete(sponsor.id)} disabled={deleting} style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", color: DANGER, borderRadius: "6px", padding: "5px 8px", fontSize: "0.72rem", cursor: deleting ? "not-allowed" : "pointer" }}>
          {deleting ? "…" : "✕"}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────
interface SponsorManagerProps {
  mode: "event" | "sport";
  entityId: string;
  title?: string;
}

export default function SponsorManager({ mode, entityId, title }: SponsorManagerProps) {
  const [sponsors, setSponsors]       = useState<Sponsor[]>([]);
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState<string | null>(null);
  const [addOpen, setAddOpen]         = useState(false);
  const [editTarget, setEditTarget]   = useState<Sponsor | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [actionBusy, setActionBusy]   = useState(false);
  const [actionErr, setActionErr]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setErr(null);
    try {
      const list = mode === "event"
        ? await getEventSponsors(entityId)
        : await getSportSponsors(entityId);
      setSponsors(list);
    } catch {
      setErr("Failed to load sponsors.");
    } finally {
      setLoading(false);
    }
  }, [mode, entityId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(form: SponsorForm) {
    setActionBusy(true);
    setActionErr(null);
    try {
      const body = {
        sponsorName: form.sponsorName.trim(),
        sponsorType: form.sponsorType || null,
        website: form.website.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        displayOrder: form.displayOrder ? parseInt(form.displayOrder, 10) : null,
      };
      const created = mode === "event"
        ? await addEventSponsor(entityId, body)
        : await addSportSponsor(entityId, body);
      setSponsors(prev => [...prev, created]);
      setAddOpen(false);
    } catch {
      setActionErr("Failed to add sponsor.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleUpdate(form: SponsorForm) {
    if (!editTarget) return;
    setActionBusy(true);
    setActionErr(null);
    try {
      const body = {
        sponsorName: form.sponsorName.trim(),
        sponsorType: form.sponsorType || null,
        website: form.website.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        displayOrder: form.displayOrder ? parseInt(form.displayOrder, 10) : null,
      };
      const updated = mode === "event"
        ? await updateEventSponsor(editTarget.id, body)
        : await updateSportSponsor(editTarget.id, body);
      setSponsors(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditTarget(null);
    } catch {
      setActionErr("Failed to update sponsor.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setActionErr(null);
    try {
      if (mode === "event") await deleteEventSponsor(id);
      else await deleteSportSponsor(id);
      setSponsors(prev => prev.filter(s => s.id !== id));
    } catch {
      setActionErr("Failed to delete sponsor.");
    } finally {
      setDeletingId(null);
    }
  }

  const headingText = title ?? (mode === "event" ? "Event Sponsors" : "Sport Sponsors");

  function toSponsorEntry(s: Sponsor): SponsorEntry {
    return { id: s.id, sponsorName: s.sponsorName, sponsorType: s.sponsorType, logoUrl: s.logoUrl, website: s.website };
  }

  function toForm(s: Sponsor): SponsorForm {
    return {
      sponsorName: s.sponsorName,
      sponsorType: s.sponsorType ?? "",
      website: s.website ?? "",
      logoUrl: s.logoUrl ?? "",
      displayOrder: s.displayOrder != null ? String(s.displayOrder) : "",
    };
  }

  return (
    <div style={{ background: CARD2, border: "1px solid rgba(250,71,21,0.12)", borderRadius: "14px", overflow: "hidden", marginTop: "24px" }}>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, background: "rgba(250,71,21,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.85rem" }}>🤝 {headingText.toUpperCase()}</div>
        <button
          onClick={() => { setActionErr(null); setAddOpen(true); }}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(250,71,21,0.1)", border: "1px solid rgba(250,71,21,0.28)", color: ACCENT, borderRadius: "8px", padding: "7px 14px", fontSize: "0.77rem", fontWeight: 700, cursor: "pointer" }}
        >+ Add Sponsor</button>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {loading && <div style={{ color: MUTED, fontSize: "0.83rem", padding: "12px 0" }}>Loading…</div>}
        {err && <div style={{ color: DANGER, fontSize: "0.83rem", marginBottom: "10px" }}>⚠️ {err}</div>}

        {!loading && sponsors.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: MUTED, fontSize: "0.83rem" }}>
            No sponsors yet — click <strong>+ Add Sponsor</strong> to get started.
          </div>
        )}

        {actionErr && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.22)", borderRadius: "8px", padding: "8px 12px", color: DANGER, fontSize: "0.78rem", marginBottom: "12px" }}>⚠️ {actionErr}</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sponsors.map(s => (
            <SponsorRow
              key={s.id}
              sponsor={s}
              onEdit={sp => { setActionErr(null); setEditTarget(sp); }}
              onDelete={handleDelete}
              deleting={deletingId === s.id}
            />
          ))}
        </div>

        {sponsors.length > 0 && (
          <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: `1px solid ${BORDER}` }}>
            <SponsorStrip sponsors={sponsors.map(toSponsorEntry)} label="Preview" />
          </div>
        )}
      </div>

      {addOpen && (
        <SponsorFormModal
          mode={mode}
          entityId={entityId}
          title="Add Sponsor"
          initial={EMPTY_FORM}
          busy={actionBusy}
          error={actionErr}
          onSave={handleAdd}
          onClose={() => { setAddOpen(false); setActionErr(null); }}
        />
      )}

      {editTarget && (
        <SponsorFormModal
          mode={mode}
          entityId={entityId}
          title="Edit Sponsor"
          initial={toForm(editTarget)}
          busy={actionBusy}
          error={actionErr}
          onSave={handleUpdate}
          onClose={() => { setEditTarget(null); setActionErr(null); }}
        />
      )}
    </div>
  );
}
