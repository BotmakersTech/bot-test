// Unified sponsor manager for event-level and sport-level sponsors.
// Usage:  <SponsorManager mode="event" entityId={eventId} title="Event Sponsors" />
//         <SponsorManager mode="sport"  entityId={sportId} title="Techsport Sponsors" />

import { useRef, useState, useEffect, useCallback } from "react";
import { X, Upload, AlertTriangle, Handshake } from "lucide-react";
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
import { ORG } from "../../Organizer/theme/organizerTheme";

// ─── Design tokens ──────────────────────────────────────────────────────────────
const ACCENT  = ORG.blue;
const CARD    = "#ffffff";
const CARD2   = "#f8f9ff";
const BORDER  = "rgba(75,134,232,0.2)";
const TEXT    = "#111111";
const MUTED   = "#6b7280";
const LABEL   = "#374151";
const DANGER  = "#dc2626";

type Sponsor = EventSponsor | SportSponsor;

interface SponsorForm {
  sponsorName: string;
  sponsorType: string;
  website: string;
  logoUrl: string;
}

const EMPTY_FORM: SponsorForm = {
  sponsorName: "", sponsorType: "", website: "", logoUrl: "",
};

// Sort priority is derived from the sponsor tier — no manual "display order".
// Lower = shown first. Anything without a recognised type sinks to the bottom.
const SPONSOR_TYPE_ORDER: Record<string, number> = {
  "Title Sponsor": 0,
  "Gold Sponsor": 1,
  "Silver Sponsor": 2,
  "Bronze Sponsor": 3,
  "Technology Partner": 4,
  "Media Partner": 5,
  "Equipment Partner": 6,
};
const orderForType = (t?: string | null): number =>
  t && SPONSOR_TYPE_ORDER[t] != null ? SPONSOR_TYPE_ORDER[t] : 99;

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
            <img src={preview} alt="logo" style={{ height: "52px", maxWidth: "90px", objectFit: "contain", borderRadius: "8px", border: `1px solid ${BORDER}`, background: "rgba(75,134,232,0.08)", padding: "4px" }} />
            <button
              type="button"
              onClick={() => { setPreview(""); onChange(""); }}
              style={{ position: "absolute", top: "-6px", right: "-6px", background: "rgba(220,38,38,0.9)", border: "none", color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><X size={10} /></button>
          </div>
        ) : (
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            style={{ width: "90px", height: "52px", border: `1px dashed ${uploading ? ACCENT : BORDER}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploading ? "wait" : "pointer", background: "rgba(75,134,232,0.06)", fontSize: "0.65rem", color: MUTED, flexDirection: "column", gap: "3px" }}
          >
            {uploading ? <span style={{ fontSize: "0.6rem", color: ACCENT }}>Uploading…</span> : <><Upload size={15} /><span>Upload</span></>}
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
              style={{ width: "100%", background: "rgba(75,134,232,0.06)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", color: TEXT, fontSize: "0.78rem", outline: "none", boxSizing: "border-box" }}
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
          style={{ width: "100%", background: "rgba(75,134,232,0.06)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: TEXT, fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#ffffff", border: `1px solid rgba(75,134,232,0.3)`, borderRadius: "16px", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflow: "auto", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: TEXT }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {field("sponsorName", "Name *", "e.g. Red Bull")}

          <div>
            <div style={{ fontSize: "0.67rem", fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Type</div>
            <select
              value={form.sponsorType}
              onChange={e => setForm(f => ({ ...f, sponsorType: e.target.value }))}
              style={{ width: "100%", background: "#ffffff", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: form.sponsorType ? TEXT : MUTED, fontSize: "0.82rem", outline: "none" }}
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
        </div>

        {error && (
          <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: "8px", padding: "10px 12px", color: DANGER, fontSize: "0.78rem", fontWeight: 600, marginTop: "16px", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ background: "rgba(75,134,232,0.08)", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: "8px", padding: "9px 18px", fontSize: "0.81rem", cursor: "pointer" }}
          >Cancel</button>
          <button
            onClick={() => !busy && form.sponsorName.trim() && onSave(form)}
            disabled={busy || !form.sponsorName.trim()}
            style={{ background: busy || !form.sponsorName.trim() ? "rgba(75,134,232,0.3)" : ACCENT, border: "none", color: "#fff", borderRadius: "8px", padding: "9px 22px", fontSize: "0.81rem", fontWeight: 700, cursor: busy || !form.sponsorName.trim() ? "not-allowed" : "pointer" }}
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
        <img src={sponsor.logoUrl} alt={sponsor.sponsorName} onError={() => setLogoErr(true)} style={{ height: "36px", width: "48px", objectFit: "contain", borderRadius: "6px", background: "rgba(75,134,232,0.06)", flexShrink: 0 }} />
      ) : (
        <div style={{ width: "48px", height: "36px", background: "rgba(75,134,232,0.06)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: MUTED, flexShrink: 0 }}>LOGO</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sponsor.sponsorName}</div>
        {sponsor.sponsorType && <div style={{ fontSize: "0.65rem", color: ACCENT, fontWeight: 600 }}>{sponsor.sponsorType}</div>}
      </div>
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <button onClick={() => onEdit(sponsor)} style={{ background: "rgba(75,134,232,0.08)", border: `1px solid ${BORDER}`, color: LABEL, borderRadius: "6px", padding: "5px 10px", fontSize: "0.72rem", cursor: "pointer" }}>Edit</button>
        <button onClick={() => onDelete(sponsor.id)} disabled={deleting} style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)", color: DANGER, borderRadius: "6px", padding: "5px 8px", fontSize: "0.72rem", cursor: deleting ? "not-allowed" : "pointer" }}>
          {deleting ? "…" : <X size={11} />}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────
type SportOption = { id: string; label: string };

interface SponsorManagerProps {
  mode: "event" | "sport";
  /** Event id for mode="event"; a single sport id for mode="sport". Omit when
   *  passing sportOptions — the built-in picker chooses the sport. */
  entityId?: string;
  title?: string;
  /** mode="sport" only. Supplying this collapses the N per-sport blocks into
   *  one block with a "Techsport" picker, plus an "All Techsports" option that
   *  writes a sponsor to every sport at once. */
  sportOptions?: SportOption[];
}

function sortSponsors<T extends Sponsor>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      orderForType(a.sponsorType) - orderForType(b.sponsorType) ||
      a.sponsorName.localeCompare(b.sponsorName),
  );
}

export default function SponsorManager({ mode, entityId, title, sportOptions }: SponsorManagerProps) {
  const usePicker = mode === "sport" && Array.isArray(sportOptions);
  const opts = sportOptions ?? [];
  const optIdsKey = opts.map(o => o.id).join(",");

  const [selectedSportId, setSelectedSportId] = useState<string>(""); // "" = All Techsports
  const [sponsors, setSponsors]       = useState<Sponsor[]>([]);
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState<string | null>(null);
  const [addOpen, setAddOpen]         = useState(false);
  const [editTarget, setEditTarget]   = useState<Sponsor | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [actionBusy, setActionBusy]   = useState(false);
  const [actionErr, setActionErr]     = useState<string | null>(null);

  // "All Techsports": one sponsor spans every sport.
  const allSports = usePicker && !selectedSportId;
  // A concrete sport id for CRUD / the logo presign — in All mode fall back to
  // the first sport so uploads still resolve.
  const activeSportId = usePicker
    ? (selectedSportId || opts[0]?.id || "")
    : (entityId ?? "");
  const uploadEntityId = mode === "event" ? (entityId ?? "") : activeSportId;

  const sportLabel = useCallback(
    (id?: string | null) => opts.find(o => o.id === id)?.label ?? "",
    [optIdsKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const load = useCallback(async () => {
    setErr(null);
    try {
      if (mode === "event") {
        if (!entityId) return;
        setLoading(true);
        setSponsors(sortSponsors(await getEventSponsors(entityId)));
      } else if (usePicker) {
        if (opts.length === 0) { setSponsors([]); return; }
        setLoading(true);
        if (selectedSportId) {
          setSponsors(sortSponsors(await getSportSponsors(selectedSportId)));
        } else {
          const lists = await Promise.all(opts.map(o => getSportSponsors(o.id)));
          setSponsors(sortSponsors(lists.flat()));
        }
      } else {
        if (!entityId) return;
        setLoading(true);
        setSponsors(sortSponsors(await getSportSponsors(entityId)));
      }
    } catch {
      setErr("Failed to load sponsors.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, entityId, usePicker, selectedSportId, optIdsKey]);

  useEffect(() => { load(); }, [load]);

  function toBody(form: SponsorForm) {
    return {
      sponsorName: form.sponsorName.trim(),
      sponsorType: form.sponsorType || null,
      website: form.website.trim() || null,
      logoUrl: form.logoUrl.trim() || null,
      // Order is a pure function of the sponsor tier now — no manual field.
      displayOrder: orderForType(form.sponsorType),
    };
  }

  async function handleAdd(form: SponsorForm) {
    setActionBusy(true);
    setActionErr(null);
    try {
      const body = toBody(form);
      if (mode === "event") {
        const created = await addEventSponsor(entityId as string, body);
        setSponsors(prev => sortSponsors([...prev, created]));
      } else if (usePicker && allSports) {
        await Promise.all(opts.map(o => addSportSponsor(o.id, body)));
        await load();
      } else {
        const created = await addSportSponsor(activeSportId, body);
        setSponsors(prev => sortSponsors([...prev, created]));
      }
      setAddOpen(false);
    } catch {
      setActionErr(
        usePicker && allSports
          ? "Failed to add the sponsor to every techsport."
          : "Failed to add sponsor.",
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleUpdate(form: SponsorForm) {
    if (!editTarget) return;
    setActionBusy(true);
    setActionErr(null);
    try {
      const body = toBody(form);
      const updated = mode === "event"
        ? await updateEventSponsor(editTarget.id, body)
        : await updateSportSponsor(editTarget.id, body);
      setSponsors(prev => sortSponsors(prev.map(s => s.id === updated.id ? updated : s)));
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

  const headingText = title ?? (mode === "event" ? "Techfect Sponsors" : "Techsport Sponsors");
  const noSports = usePicker && opts.length === 0;
  const canAdd = !noSports;

  function toSponsorEntry(s: Sponsor): SponsorEntry {
    return { id: s.id, sponsorName: s.sponsorName, sponsorType: s.sponsorType, logoUrl: s.logoUrl, website: s.website };
  }

  function toForm(s: Sponsor): SponsorForm {
    return {
      sponsorName: s.sponsorName,
      sponsorType: s.sponsorType ?? "",
      website: s.website ?? "",
      logoUrl: s.logoUrl ?? "",
    };
  }

  const pickerStyle = {
    background: "#ffffff", border: `1px solid ${BORDER}`, borderRadius: "8px",
    padding: "7px 12px", color: TEXT, fontSize: "0.8rem", outline: "none", cursor: "pointer",
  } as const;

  return (
    <div style={{ background: CARD2, border: "1px solid rgba(75,134,232,0.15)", borderRadius: "14px", overflow: "hidden", marginTop: "24px" }}>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, background: "rgba(75,134,232,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}><Handshake size={15} /> {headingText.toUpperCase()}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {usePicker && (
            <select
              value={selectedSportId}
              onChange={e => setSelectedSportId(e.target.value)}
              style={pickerStyle}
              aria-label="Techsport"
            >
              <option value="">All Techsports</option>
              {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          )}
          <button
            onClick={() => { setActionErr(null); setAddOpen(true); }}
            disabled={!canAdd}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(75,134,232,0.1)", border: "1px solid rgba(75,134,232,0.3)", color: ACCENT, borderRadius: "8px", padding: "7px 14px", fontSize: "0.77rem", fontWeight: 700, cursor: canAdd ? "pointer" : "not-allowed", opacity: canAdd ? 1 : 0.5 }}
          >+ Add Sponsor{usePicker && allSports ? " (all)" : ""}</button>
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {noSports && (
          <div style={{ textAlign: "center", padding: "24px 0", color: MUTED, fontSize: "0.83rem" }}>
            Add a Techsport first, then you can attach sponsors to it.
          </div>
        )}
        {!noSports && loading && <div style={{ color: MUTED, fontSize: "0.83rem", padding: "12px 0" }}>Loading…</div>}
        {err && <div style={{ color: DANGER, fontSize: "0.83rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} /> {err}</div>}

        {!noSports && !loading && sponsors.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: MUTED, fontSize: "0.83rem" }}>
            No sponsors yet — click <strong>+ Add Sponsor</strong> to get started.
          </div>
        )}

        {actionErr && (
          <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: "8px", padding: "8px 12px", color: DANGER, fontSize: "0.78rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} /> {actionErr}</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sponsors.map(s => (
            <div key={s.id} style={{ position: "relative" }}>
              {usePicker && allSports && "sportId" in s && (
                <div style={{ position: "absolute", top: "6px", right: "58px", zIndex: 1, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: MUTED, background: "rgba(75,134,232,0.1)", border: `1px solid ${BORDER}`, borderRadius: "5px", padding: "2px 6px", pointerEvents: "none" }}>
                  {sportLabel((s as SportSponsor).sportId)}
                </div>
              )}
              <SponsorRow
                sponsor={s}
                onEdit={sp => { setActionErr(null); setEditTarget(sp); }}
                onDelete={handleDelete}
                deleting={deletingId === s.id}
              />
            </div>
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
          entityId={uploadEntityId}
          title={usePicker && allSports ? "Add Sponsor to all Techsports" : "Add Sponsor"}
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
          entityId={mode === "sport" && "sportId" in editTarget ? (editTarget as SportSponsor).sportId : uploadEntityId}
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
