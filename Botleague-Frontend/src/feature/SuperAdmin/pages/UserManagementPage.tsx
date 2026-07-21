import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus, ChevronLeft, ChevronRight, ChevronDown, X, Users as UsersIcon } from "lucide-react";
import type { AppDispatch } from "../../../app/store";
import {
  fetchUsers,
  selectUsers,
  selectUserMgmtLoading,
  selectUserMgmtError,
  selectTotalPages,
  selectCurrentPage,
  selectTotalElements,
} from "../store/userManagementSlice";
import { createAdminUser } from "../api/userManagement.api";
import { ORG } from "../../Organizer/theme/organizerTheme";
import PrimaryButton from "../../Organizer/components/PrimaryButton";
import "../../../styles/organizerTheme.css";

const ALL_ROLES = ["COMPETITOR","SPORT_HEAD","EVENT_HEAD","ORGANISER","ADMIN","SUPER_ADMIN","JUDGE","VOLUNTEER"];
const PAGE_SIZES = [10, 25, 50];

// Vertical gradient-stroke border (matches the app-wide border-gradient
// convention — e.g. .etm-border-gradient, .cna-border-gradient — always
// 180deg, never the horizontal stroke a pasted mockup might show).
const gradientBorderStyle: React.CSSProperties = {
  border: "2px solid transparent",
  borderRadius: "0.5rem",
  backgroundImage: "linear-gradient(#fff, #fff), linear-gradient(180deg, #8C6CFF 0%, #0162D1 100%)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ firstName:"", lastName:"", phone:"", email:"", password:"", role:"COMPETITOR" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.password) {
      setErr("First name, last name, phone and password are required."); return;
    }
    setSaving(true); setErr(null);
    try {
      const user = await createAdminUser(form);
      onCreated(user.id);
    } catch (ex: any) {
      setErr(ex?.response?.data?.message ?? "Failed to create user");
    } finally { setSaving(false); }
  };

  const inp = "w-full px-4 py-3 text-[15px] text-slate-700 placeholder-slate-400 outline-none focus:shadow-[0_0_0_3px_rgba(140,108,255,0.18)]";
  const lbl = "block mb-2 text-sm font-semibold text-slate-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-[650px] rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex items-start justify-between">
          <h2 className="text-2xl font-bold" style={{ fontFamily: ORG.fontHeading, color: ORG.blueHeading }}>Create User</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="mt-1 text-slate-400 hover:text-slate-600">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handle} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={lbl}>First Name <span className="text-slate-400">*</span></label>
              <input style={gradientBorderStyle} className={inp} value={form.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="Enter First Name" />
            </div>
            <div>
              <label className={lbl}>Last Name <span className="text-slate-400">*</span></label>
              <input style={gradientBorderStyle} className={inp} value={form.lastName} onChange={e=>set("lastName",e.target.value)} placeholder="Enter Last Name" />
            </div>
          </div>

          <div>
            <label className={lbl}>Phone Number <span className="text-slate-400">*</span></label>
            <input style={gradientBorderStyle} className={inp} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="90XXXXXXXX" maxLength={10} />
          </div>

          <div>
            <label className={lbl}>Email (Optional)</label>
            <input style={gradientBorderStyle} className={inp} type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="name@example.com" />
          </div>

          <div>
            <label className={lbl}>Password <span className="text-slate-400">*</span></label>
            <input style={gradientBorderStyle} className={inp} type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min 8 characters" />
          </div>

          <div>
            <label className={lbl}>Initial Role</label>
            <div className="relative">
              <select
                className="w-full cursor-pointer appearance-none rounded-lg px-4 py-3 pr-10 font-medium text-slate-800 outline-none"
                style={{ background: "linear-gradient(90deg, rgba(75,134,232,0.14), rgba(140,108,255,0.14))" }}
                value={form.role}
                onChange={e=>set("role",e.target.value)}
              >
                {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {err && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{err}</p>}

          <div className="flex items-center justify-center gap-4 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg bg-slate-200 px-8 py-3 font-medium text-slate-700 hover:bg-slate-300">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-8 py-3 font-semibold text-white shadow-sm disabled:opacity-50"
              style={{ background: ORG.gradientCta }}
            >
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Small badge helpers ────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold italic"
      style={{ color: ORG.violet, border: `1px solid ${ORG.violet}55`, background: "rgba(140,108,255,0.08)" }}
    >
      {role.replace(/_/g, " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE";
  const isPending = status === "PENDING";
  const bg = isActive ? "#1fa952" : isPending ? "#a16207" : "#e04b4b";
  return (
    <span className="inline-block rounded-full px-4 py-1 text-xs font-semibold text-white" style={{ background: bg }}>
      {status}
    </span>
  );
}

function avatarInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const users = useSelector(selectUsers);
  const loading = useSelector(selectUserMgmtLoading);
  const error = useSelector(selectUserMgmtError);
  const totalPages = useSelector(selectTotalPages);
  const currentPage = useSelector(selectCurrentPage);
  const totalElements = useSelector(selectTotalElements);

  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [showCreate, setShowCreate] = useState(false);

  const doSearch = useCallback(
    (q: string, page: number, size: number) => dispatch(fetchUsers({ q: q || undefined, page, size })),
    [dispatch]
  );

  useEffect(() => { doSearch(activeSearch, 0, pageSize); }, [doSearch, activeSearch, pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(search);
  };

  // Numbered page buttons with an ellipsis once there are more pages than fit —
  // always show first, last, current, and current's immediate neighbors.
  const pageNumbers = (() => {
    if (totalPages <= 1) return [];
    const pages = new Set<number>([0, totalPages - 1, currentPage, currentPage - 1, currentPage + 1]);
    return [...pages].filter(p => p >= 0 && p < totalPages).sort((a, b) => a - b);
  })();

  return (
    <div className="org-page-bg" style={{ padding: "40px 48px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {showCreate && (
          <CreateUserModal
            onClose={() => setShowCreate(false)}
            onCreated={id => { setShowCreate(false); navigate(`/admin/users/${id}`); }}
          />
        )}

        <h1
          className="mb-8 text-4xl font-bold tracking-wide"
          style={{ fontFamily: ORG.fontHeading, color: ORG.blueHeading }}
        >
          User Management
        </h1>

        {/* ── Search & actions ── */}
        <form onSubmit={handleSearch} className="mb-6 flex flex-wrap items-center gap-4">
          <div
            className="flex flex-1 min-w-[300px] items-center overflow-hidden rounded-xl border shadow-sm"
            style={{ borderColor: "rgba(75,134,232,0.3)" }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or BotLeague ID…"
              className="flex-1 px-5 py-3.5 text-[15px] text-[#374151] placeholder-gray-400 outline-none"
            />
            <button
              type="submit"
              className="flex h-full items-center justify-center self-stretch px-6"
              style={{ background: ORG.gradientCta }}
              aria-label="Search"
            >
              <Search size={18} className="text-white" />
            </button>
          </div>

          <PrimaryButton type="button" onClick={() => setShowCreate(true)} style={{ padding: "14px 26px", fontSize: "0.9rem", flexShrink: 0 }}>
            <Plus size={16} /> New User
          </PrimaryButton>
        </form>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── User table ── */}
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(75,134,232,0.25)" }}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr style={{ background: ORG.gradientPill }}>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Full Name</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">BotLeague ID</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Mobile Number</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Role</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Manage</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                    Loading users…
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
              {!loading && users.map((u) => (
                <tr key={u.id} className="border-t transition-colors hover:bg-[#f8f9ff]" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.profilePhotoUrl ? (
                        <img src={u.profilePhotoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: ORG.gradientCta }}
                        >
                          {avatarInitials(u.firstName, u.lastName)}
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-[#374151]">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-400">{u.email || u.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{u.botleagueId}</td>
                  <td className="px-6 py-4"><StatusBadge status={u.accountStatus} /></td>
                  <td className="px-6 py-4 text-gray-500">{u.phone || "—"}</td>
                  <td className="px-6 py-4"><RoleBadge role={u.primaryRole} /></td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="rounded-lg px-5 py-2 text-sm font-semibold text-white"
                      style={{ background: ORG.blue }}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <button
                  disabled={currentPage === 0}
                  onClick={() => doSearch(activeSearch, currentPage - 1, pageSize)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(75,134,232,0.3)", color: ORG.muted }}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((p, i) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && p - pageNumbers[i - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
                    <button
                      onClick={() => doSearch(activeSearch, p, pageSize)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                      style={
                        p === currentPage
                          ? { background: ORG.blueHeading, color: "#fff" }
                          : { color: ORG.blueHeading }
                      }
                    >
                      {p + 1}
                    </button>
                  </span>
                ))}

                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => doSearch(activeSearch, currentPage + 1, pageSize)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: "rgba(75,134,232,0.3)", color: ORG.muted }}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            {!loading && totalElements > 0 && (
              <span className="ml-2 flex items-center gap-1.5 text-sm text-gray-400">
                <UsersIcon size={13} /> {totalElements} total
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-500">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="cursor-pointer rounded-lg border px-4 py-2 font-medium outline-none"
              style={{ borderColor: ORG.blue, color: ORG.blueHeading }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s} rows</option>)}
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
