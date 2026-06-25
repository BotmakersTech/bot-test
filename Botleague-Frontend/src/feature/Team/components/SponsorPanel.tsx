import React, { useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Globe, ExternalLink, Loader2,
  Building2, X, Check, AlertTriangle, Handshake, Upload, ImageOff,
} from "lucide-react";
import { useSponsors } from "../hooks/useSponsors";
import { SPONSOR_TYPES, uploadSponsorLogo, type Sponsor, type SponsorRequest } from "../api/sponsor.api";

// ── Design tokens ─────────────────────────────────────────────────────────────
const ACCENT  = "#fa4715";
const MUTED   = "#9ca3af";
const DANGER  = "#f87171";

// ── Sponsor type badge colors ─────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "Technology Partner":  { bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.3)",  text: "#60a5fa" },
  "Educational Partner": { bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)", text: "#a78bfa" },
  "Equipment Partner":   { bg: "rgba(250,71,21,0.1)",   border: "rgba(250,71,21,0.3)",   text: "#fa4715" },
  "Funding Sponsor":     { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.3)",  text: "#4ade80" },
  "Venue Sponsor":       { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  text: "#fbbf24" },
  "Community Partner":   { bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.3)",  text: "#f97316" },
  "Media Partner":       { bg: "rgba(236,72,153,0.1)",  border: "rgba(236,72,153,0.3)",  text: "#ec4899" },
};

function typeBadgeStyle(type: string | null): React.CSSProperties {
  const c = (type && TYPE_COLORS[type]) || { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", text: MUTED };
  return {
    display: "inline-flex", alignItems: "center",
    background: c.bg, border: `1px solid ${c.border}`,
    color: c.text, borderRadius: "999px",
    fontSize: "0.65rem", fontWeight: 700,
    padding: "2px 9px", letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  };
}

// ── LogoUploader sub-component ────────────────────────────────────────────────
interface LogoUploaderProps {
  teamId: string | null | undefined;
  value: string;           // current URL (empty = none)
  onChange: (url: string) => void;
}

function LogoUploader({ teamId, value, onChange }: LogoUploaderProps) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [preview,   setPreview]   = useState<string>(value);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploadErr(null);
    setUploading(true);

    try {
      const cdnUrl = await uploadSponsorLogo(teamId, file);
      onChange(cdnUrl);
      setPreview(cdnUrl);
    } catch (err: any) {
      setUploadErr(err?.message ?? "Upload failed");
      setPreview(value); // revert preview
      onChange(value);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
      // reset input so re-selecting same file works
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const labelCls: React.CSSProperties = {
    display: "block", fontSize: "0.68rem", fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
    color: MUTED, marginBottom: "6px",
  };

  return (
    <div>
      <label style={labelCls}>Logo</label>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Preview box */}
        <div style={{
          width: "60px", height: "60px", borderRadius: "12px", flexShrink: 0,
          background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          {uploading ? (
            <Loader2 size={20} color={ACCENT} className="animate-spin" />
          ) : preview ? (
            <img src={preview} alt="logo preview"
              onError={() => setPreview("")}
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6px" }} />
          ) : (
            <ImageOff size={22} color={MUTED} />
          )}
        </div>

        {/* Upload button */}
        <div style={{ flex: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || !teamId}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px", padding: "9px 14px",
              color: uploading ? MUTED : "#e5e7eb", fontSize: "0.82rem", fontWeight: 600,
              cursor: uploading || !teamId ? "not-allowed" : "pointer",
              width: "100%", justifyContent: "center",
            }}
          >
            <Upload size={14} />
            {uploading ? "Uploading…" : preview ? "Change Logo" : "Upload Logo"}
          </button>
          <p style={{ color: MUTED, fontSize: "0.68rem", marginTop: "4px" }}>
            JPG, PNG or WebP · max 50 MB
          </p>
          {uploadErr && (
            <p style={{ color: DANGER, fontSize: "0.72rem", marginTop: "4px" }}>
              ⚠ {uploadErr}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────────
const EMPTY_FORM: SponsorRequest = {
  sponsorName: "", sponsorType: "", website: "", logoUrl: "", description: "",
};

// ── Add / Edit modal ──────────────────────────────────────────────────────────
interface SponsorModalProps {
  title: string;
  initial?: SponsorRequest;
  teamId: string | null | undefined;
  busy: boolean;
  error: string | null;
  onSave: (data: SponsorRequest) => void;
  onClose: () => void;
}

function SponsorModal({ title, initial = EMPTY_FORM, teamId, busy, error, onSave, onClose }: SponsorModalProps) {
  const [form, setForm] = useState<SponsorRequest>({ ...initial });
  const set = (k: keyof SponsorRequest, v: string) => setForm(f => ({ ...f, [k]: v }));

  const labelCls: React.CSSProperties = {
    display: "block", fontSize: "0.68rem", fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
    color: MUTED, marginBottom: "6px",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    padding: "10px 14px", color: "#fff", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "20px" }}
      onClick={e => e.target === e.currentTarget && !busy && onClose()}
    >
      <div style={{
        background: "linear-gradient(160deg,#2e2e2e 0%,#1e1e1e 100%)",
        border: "1px solid rgba(250,71,21,0.22)", borderRadius: "20px",
        padding: "28px", width: "100%", maxWidth: "500px",
        boxShadow: "0 28px 70px rgba(0,0,0,0.65)", maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: `linear-gradient(135deg,${ACCENT},#f97316)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Handshake size={16} color="#fff" />
            </div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{title}</h3>
          </div>
          <button onClick={onClose} disabled={busy} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Sponsor Name */}
          <div>
            <label style={labelCls}>Sponsor Name *</label>
            <input
              type="text" placeholder="e.g. NVIDIA"
              value={form.sponsorName}
              onChange={e => set("sponsorName", e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Sponsor Type */}
          <div>
            <label style={labelCls}>Sponsor Type</label>
            <select
              value={form.sponsorType ?? ""}
              onChange={e => set("sponsorType", e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
            >
              <option value="">Select type…</option>
              {SPONSOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Logo upload */}
          <LogoUploader
            teamId={teamId}
            value={form.logoUrl ?? ""}
            onChange={url => setForm(f => ({ ...f, logoUrl: url }))}
          />

          {/* Website */}
          <div>
            <label style={labelCls}>Website</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "0 12px" }}>
              <Globe size={14} color={MUTED} style={{ flexShrink: 0 }} />
              <input
                type="url" placeholder="https://example.com"
                value={form.website ?? ""}
                onChange={e => set("website", e.target.value)}
                style={{ ...inputStyle, background: "transparent", border: "none", padding: "10px 0" }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelCls}>Description</label>
            <textarea
              placeholder="e.g. Provides AI hardware and GPU support"
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: "72px" }}
            />
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: DANGER, fontSize: "0.82rem", fontWeight: 600 }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
            <button
              onClick={onClose} disabled={busy}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb", borderRadius: "10px", padding: "10px 18px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={busy || !form.sponsorName.trim()}
              style={{
                background: form.sponsorName.trim() && !busy ? ACCENT : "rgba(255,255,255,0.08)",
                border: "none", color: "#fff", borderRadius: "10px",
                padding: "10px 20px", fontWeight: 700, fontSize: "0.875rem",
                cursor: busy || !form.sponsorName.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "8px",
                opacity: busy || !form.sponsorName.trim() ? 0.6 : 1,
              }}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {busy ? "Saving…" : "Save Sponsor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteConfirm({ name, busy, error, onConfirm, onClose }: {
  name: string; busy: boolean; error: string | null;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "20px" }}
      onClick={e => e.target === e.currentTarget && !busy && onClose()}
    >
      <div style={{ background: "#1e1e1e", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 28px 70px rgba(0,0,0,0.65)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(248,113,113,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={18} color={DANGER} />
          </div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#fff" }}>Remove Sponsor</h3>
        </div>
        <p style={{ color: MUTED, fontSize: "0.875rem", marginBottom: "20px", lineHeight: 1.6 }}>
          Remove <strong style={{ color: "#fff" }}>{name}</strong> from your team's sponsors? This cannot be undone.
        </p>
        {error && <div style={{ color: DANGER, fontSize: "0.82rem", marginBottom: "12px" }}>⚠ {error}</div>}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose} disabled={busy}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb", borderRadius: "10px", padding: "9px 16px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
          >Cancel</button>
          <button
            onClick={onConfirm} disabled={busy}
            style={{ background: "rgba(248,113,113,0.18)", border: "1px solid rgba(248,113,113,0.35)", color: DANGER, borderRadius: "10px", padding: "9px 16px", fontWeight: 700, fontSize: "0.875rem", cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {busy ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SponsorCard — own component so useState is always at top level ─────────────
interface SponsorCardProps {
  sponsor: Sponsor;
  isCaptain: boolean;
  onEdit: (s: Sponsor) => void;
  onDelete: (s: Sponsor) => void;
}

function SponsorCard({ sponsor: s, isCaptain, onEdit, onDelete }: SponsorCardProps) {
  const [logoErr, setLogoErr] = useState(false);

  return (
    <div style={{
      background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: "14px", padding: "16px", position: "relative",
      transition: "border 0.2s",
    }}>
      {/* Captain actions */}
      {isCaptain && (
        <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "6px" }}>
          <button
            onClick={() => onEdit(s)}
            title="Edit sponsor"
            style={{ background: "rgba(250,71,21,0.1)", border: "1px solid rgba(250,71,21,0.25)", color: ACCENT, width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(s)}
            title="Remove sponsor"
            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: DANGER, width: "28px", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Logo + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", paddingRight: isCaptain ? "64px" : "0" }}>
        {s.logoUrl && !logoErr ? (
          <img
            src={s.logoUrl} alt={s.sponsorName}
            onError={() => setLogoErr(true)}
            style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "contain", background: "#fff", padding: "4px", flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(250,71,21,0.12)", border: "1px solid rgba(250,71,21,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={20} color={ACCENT} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {s.sponsorName}
          </div>
          {s.sponsorType && <span style={typeBadgeStyle(s.sponsorType)}>{s.sponsorType}</span>}
        </div>
      </div>

      {/* Description */}
      {s.description && (
        <p style={{ color: MUTED, fontSize: "0.78rem", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
          {s.description}
        </p>
      )}

      {/* Website */}
      {s.website && (
        <a
          href={s.website} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#60a5fa", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none" }}
        >
          <Globe size={12} /> Visit website <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}

// ── Main SponsorPanel ─────────────────────────────────────────────────────────
interface SponsorPanelProps {
  teamId: string | null | undefined;
  isCaptain: boolean;
}

export default function SponsorPanel({ teamId, isCaptain }: SponsorPanelProps) {
  const { sponsors, loading, error, add, update, remove } = useSponsors(teamId);

  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<Sponsor | null>(null);
  const [delTarget,  setDelTarget]  = useState<Sponsor | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionErr,  setActionErr]  = useState<string | null>(null);

  const handleAdd = async (data: SponsorRequest) => {
    if (!teamId) return;
    setActionBusy(true); setActionErr(null);
    try { await add(teamId, data); setAddOpen(false); }
    catch (err: any) { setActionErr(err?.response?.data?.message ?? err?.message ?? "Failed to add sponsor"); }
    finally { setActionBusy(false); }
  };

  const handleUpdate = async (data: SponsorRequest) => {
    if (!editTarget) return;
    setActionBusy(true); setActionErr(null);
    try { await update(editTarget.id, data); setEditTarget(null); }
    catch (err: any) { setActionErr(err?.response?.data?.message ?? err?.message ?? "Failed to update sponsor"); }
    finally { setActionBusy(false); }
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    setActionBusy(true); setActionErr(null);
    try { await remove(delTarget.id); setDelTarget(null); }
    catch (err: any) { setActionErr(err?.response?.data?.message ?? err?.message ?? "Failed to remove sponsor"); }
    finally { setActionBusy(false); }
  };

  return (
    <>
      <div className="bg-[#343434] rounded-[20px] p-6 border border-white/9 mt-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold m-0 flex items-center gap-2 text-white">
            <Handshake size={18} className="text-gray-400" />
            Sponsors
          </h3>
          {isCaptain && (
            <button
              onClick={() => { setActionErr(null); setAddOpen(true); }}
              className="inline-flex items-center gap-1.5 bg-[#fa4715] border-transparent text-white border text-sm font-semibold rounded-xl transition-all px-3.5 py-1.5 hover:bg-[#fa4715]/88 cursor-pointer"
            >
              <Plus size={13} /> Add Sponsor
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-8 text-sm text-gray-400">
            <Loader2 size={18} className="animate-spin text-[#fa4715]" /> Loading sponsors…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="shrink-0" /> {error}
          </div>
        ) : sponsors.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-3 flex justify-center"><Handshake size={40} /></div>
            <p className="text-gray-400 mb-4 text-sm">No sponsors yet</p>
            {isCaptain && (
              <button
                onClick={() => { setActionErr(null); setAddOpen(true); }}
                className="bg-[#fa4715] border-none text-white px-5 py-2.5 rounded-xl cursor-pointer font-bold text-sm hover:bg-[#fa4715]/88 transition-colors"
              >
                Add Your First Sponsor
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {sponsors.map(s => (
              <SponsorCard
                key={s.id}
                sponsor={s}
                isCaptain={isCaptain}
                onEdit={s => { setActionErr(null); setEditTarget(s); }}
                onDelete={s => { setActionErr(null); setDelTarget(s); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen && (
        <SponsorModal
          title="Add Sponsor"
          teamId={teamId}
          busy={actionBusy}
          error={actionErr}
          onSave={handleAdd}
          onClose={() => { setAddOpen(false); setActionErr(null); }}
        />
      )}

      {editTarget && (
        <SponsorModal
          title="Edit Sponsor"
          teamId={teamId}
          initial={{
            sponsorName: editTarget.sponsorName,
            sponsorType: editTarget.sponsorType ?? "",
            website:     editTarget.website     ?? "",
            logoUrl:     editTarget.logoUrl     ?? "",
            description: editTarget.description ?? "",
          }}
          busy={actionBusy}
          error={actionErr}
          onSave={handleUpdate}
          onClose={() => { setEditTarget(null); setActionErr(null); }}
        />
      )}

      {delTarget && (
        <DeleteConfirm
          name={delTarget.sponsorName}
          busy={actionBusy}
          error={actionErr}
          onConfirm={handleDelete}
          onClose={() => { setDelTarget(null); setActionErr(null); }}
        />
      )}
    </>
  );
}
