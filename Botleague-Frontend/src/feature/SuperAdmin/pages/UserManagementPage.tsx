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
      <h1 className="mb-6 text-2xl font-bold text-red-500">User Management</h1>

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
