import React, { useEffect, useRef, useState } from "react";
import {
  createNews,
  listNewsAdmin,
  updateNews,
  deleteNews,
  uploadNewsAttachment,
  type NewsResponse,
  type NewsRequest,
} from "../api/news.api";
import { AGE_GROUP_CATALOGUE, AGE_CATEGORY_RANGES } from "../../../shared/constants/sportCatalogue";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

// ── Create News Modal ───────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (news: NewsResponse) => void;
}

function CreateNewsModal({ onClose, onCreated }: CreateModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ages, setAges] = useState<Set<string>>(new Set());
  const [sports, setSports] = useState<Set<string>>(new Set());
  const [isPinned, setIsPinned] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (set: Set<string>, setSet: (s: Set<string>) => void, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSet(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.");
      return;
    }
    setSubmitting(true);
    try {
      let attachment: { attachmentUrl?: string; attachmentKey?: string; attachmentFileType?: string } = {};
      if (file) {
        setUploading(true);
        attachment = await uploadNewsAttachment(file);
        setUploading(false);
      }
      const req: NewsRequest = {
        title: title.trim(),
        body: body.trim(),
        targetAgeCategories: Array.from(ages),
        targetSports: Array.from(sports),
        isPinned,
        ...attachment,
      };
      const created = await createNews(req);
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } } };
      setError(e?.response?.data?.message ?? e?.response?.data?.error ?? "Failed to publish News.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const recipientPreview =
    ages.size === 0 && sports.size === 0
      ? "Everyone (all active users)"
      : [
          ages.size > 0 ? `Age: ${Array.from(ages).map((a) => a.replace(/_/g, " ")).join(", ")}` : null,
          sports.size > 0 ? `Sport: ${sports.size} selected` : null,
        ]
          .filter(Boolean)
          .join("  ·  ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8">
      <div className="bg-[#13151c] border border-white/[0.08] rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] sticky top-0 bg-[#13151c]">
          <h2 className="text-lg font-semibold text-white">Publish News</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="News title"
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#0162D1]/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={5}
              placeholder="Write the News content…"
              className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#0162D1]/50 resize-vertical"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Age category (leave empty = every age)
            </label>
            <div className="flex flex-wrap gap-2">
              {AGE_GROUP_CATALOGUE.map((g) => (
                <label
                  key={g.value}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    ages.has(g.value)
                      ? "bg-[#0162D1]/15 border-[#0162D1]/50 text-white"
                      : "bg-white/[0.03] border-white/[0.1] text-neutral-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={ages.has(g.value)}
                    onChange={() => toggle(ages, setAges, g.value)}
                    className="accent-[#0162D1]"
                  />
                  {g.label} ({AGE_CATEGORY_RANGES[g.value]})
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Sport interest (leave empty = every sport)
            </label>
            <div className="flex flex-col gap-3 max-h-52 overflow-y-auto border border-white/[0.08] rounded-lg p-3">
              {AGE_GROUP_CATALOGUE.map((g) => (
                <div key={g.value}>
                  <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
                    {g.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.sports.map((s) => (
                      <label
                        key={s.value}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[0.72rem] cursor-pointer transition-colors ${
                          sports.has(s.value)
                            ? "bg-[#8C6CFF]/15 border-[#8C6CFF]/50 text-white"
                            : "bg-white/[0.03] border-white/[0.08] text-neutral-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sports.has(s.value)}
                          onChange={() => toggle(sports, setSports, s.value)}
                          className="accent-[#8C6CFF]"
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-neutral-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
            Recipients: {recipientPreview}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Attachment (optional — image or video)
            </label>
            {file ? (
              <div className="flex items-center gap-2 text-sm text-white">
                {file.name}
                <button type="button" onClick={() => setFile(null)} className="text-red-400 hover:text-red-300 text-xs">
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="self-start flex items-center gap-2 bg-white/[0.03] border border-dashed border-white/[0.15] text-neutral-400 rounded-lg px-3 py-2 text-xs"
              >
                Attach a file
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="accent-[#0162D1]" />
            Pin to top of feed
          </label>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-neutral-400 hover:text-white border border-white/[0.1] hover:border-white/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 text-sm font-medium text-white bg-[#0162D1] hover:bg-[#0052b3] rounded-lg transition-colors disabled:opacity-60"
            >
              {uploading ? "Uploading…" : submitting ? "Publishing…" : "Publish News"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (p: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNewsAdmin(p, 20);
      setItems((prev) => (p === 0 ? data.content : [...prev, ...data.content]));
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load News.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
  }, []);

  const handleCreated = (news: NewsResponse) => {
    setItems((prev) => [news, ...prev]);
  };

  const handleToggleArchive = async (item: NewsResponse) => {
    setBusyId(item.id);
    try {
      const updated = await updateNews(item.id, { isArchived: !item.isArchived });
      setItems((prev) => prev.map((n) => (n.id === item.id ? updated : n)));
    } catch {
      alert("Failed to update News.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this News item? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await deleteNews(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert("Failed to delete News.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">News</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Platform-wide announcements, filterable by age category and sport interest
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0162D1] hover:bg-[#0052b3] rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Publish News
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading && items.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-[#0162D1] border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <p className="text-neutral-400 font-medium">No News published yet</p>
            <p className="text-neutral-600 text-sm">Publish your first News item to get started.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-white">{item.title}</p>
                      {item.isPinned && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0162D1]/20 text-[#5b9bff] font-semibold">PINNED</span>
                      )}
                      {item.isArchived && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-500/20 text-neutral-400 font-semibold">ARCHIVED</span>
                      )}
                    </div>
                    <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{item.body}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-[0.7rem] text-neutral-500">
                      <span>{item.recipientCount} recipients</span>
                      <span>·</span>
                      <span>{formatDate(item.publishedAt)}</span>
                      {item.targetAgeCategories.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{item.targetAgeCategories.map((a) => a.replace(/_/g, " ")).join(", ")}</span>
                        </>
                      )}
                      {item.targetSports.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{item.targetSports.length} sport(s)</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(item)}
                      disabled={busyId === item.id}
                      className="text-xs font-medium text-neutral-400 hover:text-white disabled:opacity-50"
                    >
                      {item.isArchived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={busyId === item.id}
                      className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && page < totalPages - 1 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => load(page + 1)}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {showModal && <CreateNewsModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  );
}
