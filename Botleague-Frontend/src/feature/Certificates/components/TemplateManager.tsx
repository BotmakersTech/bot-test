import { useRef, useState } from "react";
import {
  type CertificateTemplate,
  type CreateCertificateTemplateRequest,
  type UpdateCertificateTemplateRequest,
  type TemplatePlaceholderPosition,
  type PlaceholderKey,
  PLACEHOLDER_LABELS,
  validateTemplateFile,
  readImageDimensions,
  uploadCertificateTemplateBackground,
  extractErrorMessage,
} from "../api/certificate.api";
import { ORG } from "../../Organizer/theme/organizerTheme";
import PrimaryButton from "../../Organizer/components/PrimaryButton";

const ALL_KEYS = Object.keys(PLACEHOLDER_LABELS) as PlaceholderKey[];
const PREVIEW_WIDTH = 560;

interface TemplateManagerProps {
  uploadBasePath: "/admin/certificates" | "/organizer/certificates";
  listTemplates: () => Promise<CertificateTemplate[]>;
  createTemplate: (req: CreateCertificateTemplateRequest) => Promise<CertificateTemplate>;
  updateTemplate: (id: string, req: UpdateCertificateTemplateRequest) => Promise<CertificateTemplate>;
  archiveTemplate: (id: string) => Promise<void>;
  templates: CertificateTemplate[];
  onChanged: () => void;
}

const emptyForm = () => ({
  name: "",
  backgroundAssetKey: "",
  backgroundUrl: "",
  pageWidthPx: 0,
  pageHeightPx: 0,
  placeholderMap: [] as TemplatePlaceholderPosition[],
});

export default function TemplateManager({
  uploadBasePath,
  createTemplate,
  updateTemplate,
  archiveTemplate,
  templates,
  onChanged,
}: TemplateManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CertificateTemplate | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addKey, setAddKey] = useState<PlaceholderKey | "">("");
  const dragIndex = useRef<number | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (t: CertificateTemplate) => {
    setEditing(t);
    setForm({
      name: t.name,
      backgroundAssetKey: "",
      backgroundUrl: t.backgroundUrl,
      pageWidthPx: t.pageWidthPx,
      pageHeightPx: t.pageHeightPx,
      placeholderMap: t.placeholderMap ?? [],
    });
    setError(null);
    setShowForm(true);
  };

  const handleFile = async (file: File) => {
    const validationError = validateTemplateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const dims = await readImageDimensions(file);
      const { fileUrl, key } = await uploadCertificateTemplateBackground(uploadBasePath, file);
      setForm((p) => ({
        ...p,
        backgroundAssetKey: key,
        backgroundUrl: fileUrl,
        pageWidthPx: dims.width,
        pageHeightPx: dims.height,
      }));
    } catch (e) {
      setError((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const scale = form.pageWidthPx > 0 ? Math.min(PREVIEW_WIDTH, form.pageWidthPx) / form.pageWidthPx : 1;
  const previewHeight = form.pageHeightPx * scale;

  const addPlaceholder = () => {
    if (!addKey) return;
    const isQr = addKey === "QR_CODE";
    const entry: TemplatePlaceholderPosition = isQr
      ? { key: addKey, x: form.pageWidthPx / 2 - 60, y: form.pageHeightPx / 2 - 60, sizePx: 120 }
      : {
          key: addKey,
          x: form.pageWidthPx / 2,
          y: form.pageHeightPx / 2,
          fontSize: 24,
          color: "#1a1a1a",
          align: "CENTER",
          bold: false,
        };
    setForm((p) => ({ ...p, placeholderMap: [...p.placeholderMap, entry] }));
    setAddKey("");
  };

  const removePlaceholder = (index: number) => {
    setForm((p) => ({ ...p, placeholderMap: p.placeholderMap.filter((_, i) => i !== index) }));
  };

  const updatePlaceholder = (index: number, patch: Partial<TemplatePlaceholderPosition>) => {
    setForm((p) => ({
      ...p,
      placeholderMap: p.placeholderMap.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    }));
  };

  const onMarkerPointerDown = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragIndex.current = index;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onImagePointerMove = (e: React.PointerEvent) => {
    if (dragIndex.current === null || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(form.pageWidthPx, (e.clientX - rect.left) / scale));
    const y = Math.max(0, Math.min(form.pageHeightPx, (e.clientY - rect.top) / scale));
    updatePlaceholder(dragIndex.current, { x: Math.round(x), y: Math.round(y) });
  };

  const onImagePointerUp = () => {
    dragIndex.current = null;
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!editing && !form.backgroundAssetKey) {
      setError("Upload a background image first");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateTemplate(editing.id, { name: form.name, placeholderMap: form.placeholderMap });
      } else {
        await createTemplate({
          name: form.name,
          backgroundAssetKey: form.backgroundAssetKey,
          pageWidthPx: form.pageWidthPx,
          pageHeightPx: form.pageHeightPx,
          placeholderMap: form.placeholderMap,
        });
      }
      setShowForm(false);
      onChanged();
    } catch (e) {
      setError(extractErrorMessage(e, "Failed to save template"));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (t: CertificateTemplate) => {
    await updateTemplate(t.id, { status: "ACTIVE" });
    onChanged();
  };

  const handleArchive = async (t: CertificateTemplate) => {
    if (!confirm(`Archive template "${t.name}"?`)) return;
    await archiveTemplate(t.id);
    onChanged();
  };

  const unusedKeys = ALL_KEYS.filter((k) => !form.placeholderMap.some((p) => p.key === k));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: ORG.muted }}>
          Background image + placeholder coordinates — the generation engine draws each recipient's data onto this template.
        </p>
        <PrimaryButton onClick={openAdd}>+ New Template</PrimaryButton>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: ORG.blue + "4d" }}>
          <p className="text-sm" style={{ color: ORG.muted }}>No templates yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl overflow-hidden" style={{ background: ORG.cardBg, border: ORG.cardBorder }}>
              <div className="aspect-[4/3] bg-black/5 overflow-hidden">
                <img src={t.backgroundUrl} alt={t.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold" style={{ color: ORG.textStrong }}>{t.name}</span>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{
                      color: t.status === "ACTIVE" ? ORG.success : t.status === "ARCHIVED" ? ORG.danger : ORG.warning,
                      background:
                        (t.status === "ACTIVE" ? ORG.success : t.status === "ARCHIVED" ? ORG.danger : ORG.warning) + "1a",
                    }}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: ORG.muted }}>{t.placeholderMap?.length ?? 0} placeholders</p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => openEdit(t)} className="flex-1 rounded-lg text-xs py-1.5" style={{ background: ORG.blue + "14", color: ORG.blueHeading }}>
                    Edit
                  </button>
                  {t.status !== "ACTIVE" && (
                    <button onClick={() => handleActivate(t)} className="flex-1 rounded-lg text-xs py-1.5" style={{ background: ORG.success + "1a", color: ORG.success }}>
                      Activate
                    </button>
                  )}
                  {t.status !== "ARCHIVED" && (
                    <button onClick={() => handleArchive(t)} className="rounded-lg text-xs py-1.5 px-2" style={{ background: ORG.danger + "1a", color: ORG.danger }}>
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 space-y-4 max-h-[92vh] overflow-y-auto" style={{ border: ORG.cardBorder }}>
            <h3 className="text-base font-bold" style={{ color: ORG.textStrong, fontFamily: ORG.fontHeading }}>
              {editing ? "Edit Template" : "New Template"}
            </h3>

            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg bg-white px-3 py-2 text-sm ring-1 focus:outline-none"
                style={{ color: ORG.text, boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}
              />
            </div>

            {!editing && (
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: ORG.muted }}>Background image (PNG/JPEG) *</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  disabled={uploading}
                />
                {uploading && <p className="text-xs mt-1" style={{ color: ORG.muted }}>Uploading…</p>}
              </div>
            )}

            {form.backgroundUrl && form.pageWidthPx > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold" style={{ color: ORG.muted }}>
                    Placeholders — drag markers to position them
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={addKey}
                      onChange={(e) => setAddKey(e.target.value as PlaceholderKey | "")}
                      className="rounded-lg bg-white px-2 py-1 text-xs ring-1 focus:outline-none"
                      style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}
                    >
                      <option value="">Add placeholder…</option>
                      {unusedKeys.map((k) => (
                        <option key={k} value={k}>{PLACEHOLDER_LABELS[k]}</option>
                      ))}
                    </select>
                    <button onClick={addPlaceholder} disabled={!addKey} className="rounded-lg text-xs px-3 py-1 disabled:opacity-50" style={{ background: ORG.blue + "1a", color: ORG.blueHeading }}>
                      Add
                    </button>
                  </div>
                </div>

                <div
                  ref={imageRef}
                  onPointerMove={onImagePointerMove}
                  onPointerUp={onImagePointerUp}
                  className="relative select-none"
                  style={{ width: Math.min(PREVIEW_WIDTH, form.pageWidthPx) * scale, height: previewHeight, touchAction: "none" }}
                >
                  <img src={form.backgroundUrl} alt="Template preview" className="absolute inset-0 w-full h-full object-cover rounded-lg pointer-events-none" />
                  {form.placeholderMap.map((p, i) => (
                    <div
                      key={p.key}
                      onPointerDown={onMarkerPointerDown(i)}
                      className="absolute rounded-full flex items-center justify-center text-[9px] font-bold text-white cursor-move shadow-md"
                      style={{
                        left: p.x * scale - 8,
                        top: p.y * scale - 8,
                        width: 16,
                        height: 16,
                        background: p.key === "QR_CODE" ? ORG.violet : ORG.blueHeading,
                      }}
                      title={PLACEHOLDER_LABELS[p.key]}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-2">
                  {form.placeholderMap.map((p, i) => (
                    <div key={p.key} className="flex flex-wrap items-center gap-2 rounded-lg p-2" style={{ background: ORG.blue + "0d" }}>
                      <span className="text-xs font-bold w-36 shrink-0" style={{ color: ORG.blueHeading }}>{i + 1}. {PLACEHOLDER_LABELS[p.key]}</span>
                      {p.key === "QR_CODE" ? (
                        <label className="text-xs flex items-center gap-1">
                          Size
                          <input type="number" value={p.sizePx ?? 120} onChange={(e) => updatePlaceholder(i, { sizePx: Number(e.target.value) })} className="w-16 rounded px-1 py-0.5 ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }} />
                        </label>
                      ) : (
                        <>
                          <label className="text-xs flex items-center gap-1">
                            Size
                            <input type="number" value={p.fontSize ?? 24} onChange={(e) => updatePlaceholder(i, { fontSize: Number(e.target.value) })} className="w-14 rounded px-1 py-0.5 ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }} />
                          </label>
                          <label className="text-xs flex items-center gap-1">
                            Color
                            <input type="color" value={p.color ?? "#1a1a1a"} onChange={(e) => updatePlaceholder(i, { color: e.target.value })} className="w-8 h-6 rounded" />
                          </label>
                          <select value={p.align ?? "CENTER"} onChange={(e) => updatePlaceholder(i, { align: e.target.value as TemplatePlaceholderPosition["align"] })} className="text-xs rounded px-1 py-0.5 ring-1" style={{ boxShadow: `inset 0 0 0 1px ${ORG.blue}4d` }}>
                            <option value="LEFT">Left</option>
                            <option value="CENTER">Center</option>
                            <option value="RIGHT">Right</option>
                          </select>
                          <label className="text-xs flex items-center gap-1">
                            <input type="checkbox" checked={!!p.bold} onChange={(e) => updatePlaceholder(i, { bold: e.target.checked })} />
                            Bold
                          </label>
                        </>
                      )}
                      <button onClick={() => removePlaceholder(i)} className="ml-auto text-xs px-2 py-0.5 rounded" style={{ background: ORG.danger + "1a", color: ORG.danger }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm" style={{ color: ORG.danger }}>{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl py-2 text-sm" style={{ border: `1px solid ${ORG.blue}4d`, color: ORG.muted }}>
                Cancel
              </button>
              <PrimaryButton onClick={handleSave} disabled={saving || uploading} style={{ flex: 1, justifyContent: "center" }}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Template"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
