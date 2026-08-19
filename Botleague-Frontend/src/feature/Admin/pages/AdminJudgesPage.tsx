import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Users as UsersIcon } from "lucide-react"
import { listUsers, type UserSummary } from "../../SuperAdmin/api/userManagement.api"
import { ORG } from "../../Organizer/theme/organizerTheme"
import MobileJudgeEcosystem from "../components/MobileJudgeEcosystem"
import { resolveAvatarSrc } from "../../Profile/constants/avatars"
import "../../../styles/organizerTheme.css"
import "../../../styles/responsiveView.css"
import "../../../styles/adminMobileList.css"

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold italic"
      style={{ color: ORG.violet, border: `1px solid ${ORG.violet}55`, background: "rgba(140,108,255,0.08)" }}
    >
      {role.replace(/_/g, " ")}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "ACTIVE"
  const isPending = status === "PENDING"
  const bg = isActive ? "#1fa952" : isPending ? "#a16207" : "#e04b4b"
  return (
    <span className="inline-block rounded-full px-4 py-1 text-xs font-semibold text-white" style={{ background: bg }}>
      {status}
    </span>
  )
}

function avatarInitials(firstName?: string, lastName?: string, fallback?: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase()
  return initials || fallback?.charAt(0).toUpperCase() || "?"
}

export default function AdminJudgesPage() {
  const navigate = useNavigate()
  const [judges, setJudges] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeSearch, setActiveSearch] = useState("")

  useEffect(() => {
    setLoading(true)
    setError(null)
    listUsers(activeSearch || undefined, 0, 100)
      .then((res) => {
        const filtered = res.content.filter((u) => u.allRoles?.includes("JUDGE"))
        setJudges(filtered)
      })
      .catch(() => setError("Failed to load judges"))
      .finally(() => setLoading(false))
  }, [activeSearch])

  const submitSearch = () => setActiveSearch(search)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    submitSearch()
  }

  return (
    <>
    <div className="org-page-bg p-8 view-desktop-only">
      <div style={{ position: "relative", zIndex: 1 }}>
        <h1 className="font-display mb-2 text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1] tracking-wide">
          Judge Ecosystem
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {loading ? "Loading…" : `${judges.length} user${judges.length !== 1 ? "s" : ""} with judge-level access`}
        </p>

        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(75,134,232,0.08)", border: "1px solid rgba(75,134,232,0.25)", color: ORG.blueHeading }}
        >
          Judges are users with the <span className="font-semibold">JUDGE</span> role. Assign roles via{" "}
          <button onClick={() => navigate("/admin/users")} className="underline hover:opacity-80">
            User Management
          </button>
          .
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex flex-wrap items-center gap-4">
          <div
            className="flex flex-1 min-w-[300px] items-center overflow-hidden rounded-xl border shadow-sm"
            style={{ borderColor: "rgba(75,134,232,0.3)" }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
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
        </form>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "rgba(75,134,232,0.25)" }}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr style={{ background: ORG.gradientPill }}>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">User</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">BotLeague ID</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Mobile Number</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Role</th>
                <th className="px-6 py-4 text-[15px] font-semibold text-white">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {!error && loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                    Loading judges…
                  </td>
                </tr>
              )}
              {!error && !loading && judges.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                    No judges found.{" "}
                    <button onClick={() => navigate("/admin/users")} className="font-semibold underline" style={{ color: ORG.blueHeading }}>
                      Assign roles in User Management →
                    </button>
                  </td>
                </tr>
              )}
              {!error && !loading && judges.map((u) => (
                <tr key={u.id} className="border-t transition-colors hover:bg-[#f8f9ff]" style={{ borderColor: "rgba(75,134,232,0.14)" }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {resolveAvatarSrc(u.profilePhotoUrl) ? (
                        <img src={resolveAvatarSrc(u.profilePhotoUrl)!} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <span
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: ORG.gradientCta }}
                        >
                          {avatarInitials(u.firstName, u.lastName, u.email)}
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-[#374151]">
                          {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "—"}
                        </div>
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
                      onClick={() => navigate(`/admin/judges/${u.id}`)}
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

        {!loading && !error && judges.length > 0 && (
          <div className="mt-6 flex items-center gap-1.5 text-sm text-gray-400">
            <UsersIcon size={13} /> {judges.length} total
          </div>
        )}
      </div>
    </div>

    <div className="view-mobile-only">
      <MobileJudgeEcosystem
        judges={judges}
        loading={loading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={submitSearch}
        onRowClick={(id) => navigate(`/admin/judges/${id}`)}
        onManageRoles={() => navigate("/admin/users")}
      />
    </div>
    </>
  )
}
