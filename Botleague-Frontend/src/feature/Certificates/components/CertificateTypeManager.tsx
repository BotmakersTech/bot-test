import { useEffect, useState } from "react";
import {
  type CertificateTemplate,
  type CertificateType,
  type CreateCertificateTypeRequest,
  type UpdateCertificateTypeRequest,
  type CertificateGenerationJob,
  type IssuedCertificate,
  type ManualRecipientRequest,
  type CertificateCategory,
  type EligibilityRule,
  CATEGORY_LABELS,
  extractErrorMessage,
} from "../api/certificate.api";
import { ORG } from "../../Organizer/theme/organizerTheme";
import PrimaryButton from "../../Organizer/components/PrimaryButton";

interface CertificateTypeManagerProps {
  eventSportId: string;
  activeTemplates: CertificateTemplate[];
  listTypes: (eventSportId: string) => Promise<CertificateType[]>;
  createType: (eventSportId: string, req: CreateCertificateTypeRequest) => Promise<CertificateType>;
  updateType: (typeId: string, req: UpdateCertificateTypeRequest) => Promise<CertificateType>;
  triggerGeneration: (typeId: string, manualRecipients?: ManualRecipientRequest[]) => Promise<CertificateGenerationJob>;
  listJobs: (typeId: string) => Promise<CertificateGenerationJob[]>;
  listIssued: (typeId: string) => Promise<IssuedCertificate[]>;
  revoke: (issuedCertificateId: string, reason: string) => Promise<void>;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CertificateCategory[];
const RULES: { value: EligibilityRule; label: string }[] = [
  { value: "ALL_REGISTERED", label: "Every registered participant" },
  { value: "RANK_EQUALS", label: "Finalized rank equals…" },
  { value: "MANUAL_SELECT", label: "Manually selected recipients" },
];

const emptyForm = (): CreateCertificateTypeRequest => ({
  category: "PARTICIPATION",
  label: "",
  templateId: "",
  eligibilityRule: "ALL_REGISTERED",
  numberPrefix: "CERT",
  numberFormat: "{seq}",
  verificationEnabled: true,
  qrEnabled: true,
  signatureEnabled: true,
});

const badgeColor = (status: string) =>
  status === "COMPLETED" ? ORG.success : status === "FAILED" ? ORG.danger : status === "PARTIAL" ? ORG.warning : ORG.blueHeading;

export default function CertificateTypeManager({
  eventSportId,
  activeTemplates,
  listTypes,
  createType,
  updateType,
  triggerGeneration,
  listJobs,
  listIssued,
  revoke,
}: CertificateTypeManagerProps) {
  const [types, setTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CertificateType | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<CertificateGenerationJob[]>([]);
  const [issued, setIssued] = useState<IssuedCertificate[]>([]);
  const [panelTab, setPanelTab] = useState<"jobs" | "issued">("jobs");
  const [manualNames, setManualNames] = useState("");
  const [generating, setGenerating] = useState(false);

  const refresh = () => {
    setLoading(true);
    listTypes(eventSportId).then(setTypes).catch(() => setError("Failed to load certificate types")).finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    setExpandedTypeId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSportId]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (t: CertificateType) => {
    setEditing(t);
    setForm({
      category: t.category,
      label: t.label,
      templateId: t.templateId,
      eligibilityRule: t.eligibilityRule,
      eligibilityRank: t.eligibilityRank ?? undefined,
      numberPrefix: t.numberPrefix,
      numberFormat: t.numberFormat,
      validityYears: t.validityYears ?? undefined,
      verificationEnabled: t.verificationEnabled,
      qrEnabled: t.qrEnabled,
      signatureEnabled: t.signatureEnabled,
    });
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.templateId) {
      setError("Label and template are required");
      return;
    }
    if (form.eligibilityRule === "RANK_EQUALS" && !form.eligibilityRank) {
      setError("Enter the rank this certificate should match");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) await updateType(editing.id, form);
      else await createType(eventSportId, form);
      setShowForm(false);
      refresh();
    } catch (e) {
      setError(extractErrorMessage(e, "Failed to save certificate type"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (t: CertificateType) => {
    await updateType(t.id, { status: t.status === "ACTIVE" ? "DISABLED" : "ACTIVE" });
    refresh();
  };

  const openPanel = (typeId: string, tab: "jobs" | "issued") => {
    setExpandedTypeId(typeId);
    setPanelTab(tab);
    listJobs(typeId).then(setJobs).catch(() => {});
    listIssued(typeId).then(setIssued).catch(() => {});
  };

  const handleGenerate = async (t: CertificateType) => {
    let manual: ManualRecipientRequest[] | undefined;
    if (t.eligibilityRule === "MANUAL_SELECT") {
      const names = manualNames.split("\n").map((n) => n.trim()).filter(Boolean);
      if (names.length === 0) {
        setError("Enter at least one recipient name (one per line) before generating");
        return;
      }
      manual = names.map((recipientName) => ({ recipientName }));
    }
    setGenerating(true);
    setError(null);
    try {
      await triggerGeneration(t.id, manual);
      setManualNames("");
      openPanel(t.id, "jobs");
      refresh();
    } catch (e) {
      setError(extractErrorMessage(e, "Failed to trigger generation"));
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (cert: IssuedCertificate) => {
    const reason = prompt(`Reason for revoking ${cert.recipientName}'s certificate?`);
    if (reason === null) return;
    await revoke(cert.id, reason);
    if (expandedTypeId) openPanel(expandedTypeId, "issued");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: ORG.muted }}>
          Certificates unlock once this sport's rankings are finalized.
        </p>
        <PrimaryButton onClick={openAdd} disabled={activeTemplates.length === 0}>+ New Certificate Type</PrimaryButton>
      </div>
      {activeTemplates.length === 0 && (
        <p className="text-xs" style={{ color: ORG.warning }}>Activate at least one template before configuring certificate types.</p>
      )}

      {error && <p className="text-sm" style={{ color: ORG.danger }}>{error}</p>}

      {loading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl" style={{ background: ORG.blue + "14" }} />)}</div>
      ) : types.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: ORG.blue + "4d" }}>
          <p className="text-sm" style={{ color: ORG.muted }}>No certificate types configured for this sport yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {types.map((t) => (
            <div key={t.id} className="rounded-2xl overflow-hidden" style={{ background: ORG.cardBg, border: ORG.cardBorder }}>
              <div className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-48">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: ORG.textStrong }}>{t.label}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: ORG.blue + "1a", color: ORG.blueHeading }}>
                      {CATEGORY_LABELS[t.category]}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ background: (t.status === "ACTIVE" ? ORG.success : ORG.muted) + "1a", color: t.status === "ACTIVE" ? ORG.success : ORG.muted }}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: ORG.muted }}>
                    {RULES.find((r) => r.value === t.eligibilityRule)?.label}
                    {t.eligibilityRule === "RANK_EQUALS" ? ` (rank ${t.eligibilityRank})` : ""} · {t.issuedCount} issued
                  </p>
                </div>
                <button onClick={() => openEdit(t)} className="rounded-lg text-xs px-3 py-1.5" style={{ background: ORG.blue + "14", color: ORG.blueHeading }}>Edit</button>
                <button onClick={() => toggleStatus(t)} className="rounded-lg text-xs px-3 py-1.5" style={{ background: ORG.muted + "1a", color: ORG.muted }}>
                  {t.status === "ACTIVE" ? "Disable" : "Enable"}
                </button>
                <button onClick={() => openPanel(t.id, "jobs")} className="rounded-lg text-xs px-3 py-1.5" style={{ background: ORG.violet + "14", color: ORG.violetHeading }}>Jobs</button>
                <button onClick={() => openPanel(t.id, "issued")} className="rounded-lg text-xs px-3 py-1.5" style={{ background: ORG.violet + "14", color: ORG.violetHeading }}>Issued</button>
              </div>

              {expandedTypeId === t.id && (
                <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: ORG.blue + "26" }}>
                  <div className="flex items-center gap-2">
                    {t.eligibilityRule === "MANUAL_SELECT" && (
                      <textarea
                        value={manualNames}
                        onChange={(e) => setManualNames(e.target.value)}
                        placeholder="One recipient name per line"
                        rows={2}
                        className="flex-1 rounded-lg text-xs px-2 py-1 ring-1"
                        style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}
                      />
                    )}
                    <PrimaryButton onClick={() => handleGenerate(t)} disabled={generating || t.status !== "ACTIVE"}>
                      {generating ? "Generating…" : "Generate"}
                    </PrimaryButton>
                  </div>

                  <div className="flex gap-2 text-xs font-semibold">
                    <button onClick={() => setPanelTab("jobs")} style={{ color: panelTab === "jobs" ? ORG.blueHeading : ORG.muted }}>Jobs ({jobs.length})</button>
                    <button onClick={() => setPanelTab("issued")} style={{ color: panelTab === "issued" ? ORG.blueHeading : ORG.muted }}>Issued ({issued.length})</button>
                  </div>

                  {panelTab === "jobs" ? (
                    jobs.length === 0 ? (
                      <p className="text-xs" style={{ color: ORG.muted }}>No generation jobs yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {jobs.map((j) => (
                          <div key={j.id} className="flex items-center justify-between text-xs rounded-lg px-2 py-1.5" style={{ background: ORG.blue + "0d" }}>
                            <span className="font-bold" style={{ color: badgeColor(j.status) }}>{j.status}</span>
                            <span style={{ color: ORG.muted }}>{j.succeededCount}/{j.totalRecipients} succeeded{j.failedCount ? `, ${j.failedCount} failed` : ""}</span>
                            <span style={{ color: ORG.muted }}>{j.createdAt ? new Date(j.createdAt).toLocaleString("en-IN") : "—"}</span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : issued.length === 0 ? (
                    <p className="text-xs" style={{ color: ORG.muted }}>No certificates issued yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {issued.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-xs rounded-lg px-2 py-1.5 gap-2" style={{ background: ORG.blue + "0d" }}>
                          <span className="font-semibold flex-1" style={{ color: ORG.textStrong }}>{c.recipientName}</span>
                          <span style={{ color: ORG.muted }}>{c.certificateNumber}</span>
                          <span
                            className="font-bold"
                            style={{ color: c.status === "ACTIVE" ? ORG.success : ORG.danger }}
                          >
                            {c.status}
                          </span>
                          <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: ORG.blueHeading }}>PDF</a>
                          {c.status === "ACTIVE" && (
                            <button onClick={() => handleRevoke(c)} className="px-2 py-0.5 rounded" style={{ background: ORG.danger + "1a", color: ORG.danger }}>Revoke</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-3 max-h-[92vh] overflow-y-auto" style={{ border: ORG.cardBorder }}>
            <h3 className="text-base font-bold" style={{ color: ORG.textStrong, fontFamily: ORG.fontHeading }}>
              {editing ? "Edit Certificate Type" : "New Certificate Type"}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Category *</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as CertificateCategory }))} className="w-full rounded-lg px-3 py-2 text-sm ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Label *</label>
                <input type="text" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="e.g. RoboWar Champion" className="w-full rounded-lg px-3 py-2 text-sm ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Template *</label>
              <select value={form.templateId} onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}>
                <option value="">— Select —</option>
                {activeTemplates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Who gets this certificate *</label>
                <select value={form.eligibilityRule} onChange={(e) => setForm((p) => ({ ...p, eligibilityRule: e.target.value as EligibilityRule }))} className="w-full rounded-lg px-3 py-2 text-sm ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}>
                  {RULES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {form.eligibilityRule === "RANK_EQUALS" && (
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Rank *</label>
                  <input type="number" min={1} value={form.eligibilityRank ?? ""} onChange={(e) => setForm((p) => ({ ...p, eligibilityRank: e.target.value ? Number(e.target.value) : undefined }))} className="w-full rounded-lg px-3 py-2 text-sm ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Number prefix</label>
                <input type="text" value={form.numberPrefix} onChange={(e) => setForm((p) => ({ ...p, numberPrefix: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Validity (years)</label>
                <input type="number" min={1} value={form.validityYears ?? ""} onChange={(e) => setForm((p) => ({ ...p, validityYears: e.target.value ? Number(e.target.value) : undefined }))} placeholder="Lifetime" className="w-full rounded-lg px-3 py-2 text-sm ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }} />
              </div>
            </div>

            <div className="flex gap-4 text-xs font-semibold" style={{ color: ORG.muted }}>
              <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.qrEnabled} onChange={(e) => setForm((p) => ({ ...p, qrEnabled: e.target.checked }))} /> QR code</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.verificationEnabled} onChange={(e) => setForm((p) => ({ ...p, verificationEnabled: e.target.checked }))} /> Public verification</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={!!form.signatureEnabled} onChange={(e) => setForm((p) => ({ ...p, signatureEnabled: e.target.checked }))} /> Digital signature</label>
            </div>

            {error && <p className="text-sm" style={{ color: ORG.danger }}>{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl py-2 text-sm" style={{ border: `1px solid ${ORG.blue}4d`, color: ORG.muted }}>Cancel</button>
              <PrimaryButton onClick={handleSave} disabled={saving} style={{ flex: 1, justifyContent: "center" }}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
