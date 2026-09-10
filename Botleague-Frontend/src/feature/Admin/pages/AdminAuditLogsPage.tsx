import { useEffect, useState, useCallback } from "react"
import { getAuditLogs, type AuditLogEntry } from "../api/auditLog.api"
import MobileAuditLogs from "../components/MobileAuditLogs"
import "../../../styles/responsiveView.css"
import "../../../styles/adminMobileList.css"

const ENTITY_TYPES = ["ALL", "USER", "TEAM", "ROBOT", "EVENT", "MATCH", "REGISTRATION", "SPONSOR"]
const ENTITY_LABELS: Record<string, string> = {
  ALL: "All Types", USER: "User", TEAM: "Team", ROBOT: "Robot",
  EVENT: "Techfest", MATCH: "Match", REGISTRATION: "Registration", SPONSOR: "Sponsor",
}

function humanize(raw: string): string {
  return raw.replace(/_/g, " ")
}

function formatValue(val?: string | null): string | null {
  if (!val) return null
  try {
    return JSON.stringify(JSON.parse(val), null, 2)
  } catch {
    return val
  }
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  }
}

function LogCard({ log }: { log: AuditLogEntry }) {
  const old = formatValue(log.oldValue)
  const nw = formatValue(log.newValue)
  const { date, time } = fmtDateTime(log.createdAt)

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 md:p-5">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
          <span className="w-fit shrink-0 rounded-lg border border-[#0162d1] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0162d1]">
            {humanize(log.action)}
          </span>
          <div className="min-w-0">
            <div className="font-semibold uppercase text-[#111] truncate">{log.entityName ?? log.entityType}</div>
            <div className="text-xs text-[#6b7280] lowercase mt-0.5">
              {log.actorEmail && <>{log.actorEmail} &nbsp;·&nbsp; </>}{date} &nbsp;·&nbsp; {time}
            </div>
          </div>
        </div>

        {(old || nw) && (
          <div className="flex items-center gap-4 md:gap-6 flex-wrap shrink-0">
            {old && (
              <div className="text-center">
                <span className="rounded-full border border-[#ff9718] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#ff9718]">
                  Before
                </span>
                <div className="text-xs text-[#374151] mt-1 max-w-[200px] whitespace-pre-wrap break-words">{old}</div>
              </div>
            )}
            {nw && (
              <div className="text-center">
                <span className="rounded-full border border-[#1fa952] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1fa952]">
                  After
                </span>
                <div className="text-xs text-[#374151] mt-1 max-w-[200px] whitespace-pre-wrap break-words">{nw}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {log.reason && (
        <p className="mt-3 pt-3 border-t border-black/5 text-xs text-[#6b7280]">
          <span className="uppercase text-[10px] tracking-wider text-[#9ca3af]">Reason: </span>
          {log.reason}
        </p>
      )}
    </div>
  )
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityType, setEntityType] = useState("ALL")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const load = useCallback(async (et: string, p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAuditLogs(p, 25, et !== "ALL" ? et : undefined)
      setLogs(res.content)
      setTotalPages(res.totalPages)
      setTotalElements(res.totalElements)
    } catch {
      setError("Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(entityType, page)
  }, [entityType, page, load])

  const handleTypeChange = (t: string) => {
    setEntityType(t)
    setPage(0)
  }

  return (
    <>
    <div className="min-h-full p-8 space-y-6 view-desktop-only">
      <div>
        <h1 className="font-display text-[clamp(20px,4vw,38px)] font-medium text-[#0162d1]">
          Audit Logs
        </h1>
        <p className="text-sm text-[#6b7280] mt-0.5">
          {loading ? "Loading…" : `${totalElements.toLocaleString()} log entries`}
        </p>
      </div>

      {/* Entity type filter */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {ENTITY_TYPES.map((t) => {
          const active = entityType === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`rounded-lg px-3 md:px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-linear-to-b from-[#0162d1]/75 to-[#8c6cff]/75 text-white"
                  : "border-2 border-[#0162d1] text-[#0162d1] hover:bg-[#0162d1]/5"
              }`}
            >
              {ENTITY_LABELS[t]}
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-600 text-sm text-center">{error}</div>
      ) : loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[#4b86e8]/8" />)}</div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#4b86e8]/30 py-16 text-center">
          <p className="text-[#6b7280] text-sm">No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => <LogCard key={log.id} log={log} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#6b7280]">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border-2 border-[#0162d1] px-4 py-2 text-sm font-semibold text-[#0162d1] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0162d1]/5 transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border-2 border-[#0162d1] px-4 py-2 text-sm font-semibold text-[#0162d1] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0162d1]/5 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>

    <div className="view-mobile-only">
      <MobileAuditLogs
        logs={logs}
        loading={loading}
        error={error}
        entityType={entityType}
        onEntityTypeChange={handleTypeChange}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPrevPage={() => setPage((p) => p - 1)}
        onNextPage={() => setPage((p) => p + 1)}
      />
    </div>
    </>
  )
}
