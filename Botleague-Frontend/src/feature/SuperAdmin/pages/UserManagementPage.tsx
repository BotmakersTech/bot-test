import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../app/store";
import {
  fetchUsers,
  selectUsers,
  selectUserMgmtLoading,
  selectUserMgmtError,
  selectTotalPages,
  selectCurrentPage,
} from "../store/userManagementSlice";
import { createAdminUser } from "../api/userManagement.api";

const ALL_ROLES = ["COMPETITOR","SPORT_HEAD","EVENT_HEAD","ORGANISER","ADMIN","SUPER_ADMIN","JUDGE","VOLUNTEER"];

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

  const inp = "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#fa4715]/50";
  const lbl = "block mb-1 text-xs font-semibold text-neutral-400 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111113] p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold text-white">Create User</h2>
        <form onSubmit={handle} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>First Name *</label><input className={inp} value={form.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="First name" /></div>
            <div><label className={lbl}>Last Name *</label><input className={inp} value={form.lastName} onChange={e=>set("lastName",e.target.value)} placeholder="Last name" /></div>
          </div>
          <div><label className={lbl}>Phone * (10 digits)</label><input className={inp} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="9XXXXXXXXX" maxLength={10} /></div>
          <div><label className={lbl}>Email (optional)</label><input className={inp} type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@example.com" /></div>
          <div><label className={lbl}>Password *</label><input className={inp} type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min 8 characters" /></div>
          <div>
            <label className={lbl}>Initial Role *</label>
            <select className={`${inp} cursor-pointer`} value={form.role} onChange={e=>set("role",e.target.value)}>
              {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
            </select>
          </div>
          {err && <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl bg-white/5 px-5 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#fa4715] px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-50">
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
    <span className="inline-flex items-center rounded-full bg-[#fa4715]/10 px-2.5 py-0.5 text-xs font-medium text-orange-400 border border-[#fa4715]/20">
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "ACTIVE" ? "bg-green-500/10 text-green-400" :
    status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" :
    "bg-red-500/10 text-red-400";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
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

  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const doSearch = useCallback(
    (q: string, page: number) => dispatch(fetchUsers({ q: q || undefined, page })),
    [dispatch]
  );

  useEffect(() => { doSearch(activeSearch, 0); }, [doSearch, activeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(search);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={id => { setShowCreate(false); navigate(`/admin/users/${id}`); }}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-red-500">User Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-[#fa4715] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
        >
          + Create User
        </button>
      </div>

      {/* ── Search ── */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or BotLeague ID…"
          className="flex-1 rounded-lg bg-white/5 px-4 py-2.5 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-500 transition-colors"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── User table ── */}
      <div className="rounded-xl ring-1 ring-white/[0.08] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] text-neutral-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">BotLeague ID</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Loading users…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-neutral-400">{u.email || u.phone}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-400">{u.botleagueId}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.primaryRole} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.accountStatus} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                    className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors"
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
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={currentPage === 0}
            onClick={() => doSearch(activeSearch, currentPage - 1)}
            className="rounded-lg px-3 py-1.5 text-sm bg-white/[0.06] text-neutral-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-sm text-neutral-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => doSearch(activeSearch, currentPage + 1)}
            className="rounded-lg px-3 py-1.5 text-sm bg-white/[0.06] text-neutral-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}

    </div>
  );
}
