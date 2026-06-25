import { useEffect, useState, useCallback } from "react"
import { getAuditLogs, type AuditLogEntry } from "../api/auditLog.api"

const ENTITY_TYPES = ["ALL", "USER", "TEAM", "ROBOT", "EVENT", "MATCH", "REGISTRATION", "SPONSOR"]

function formatValue(val?: string | null): string | null {
  if (!val) return null
  try {
    return JSON.stringify(JSON.parse(val), null, 2)
  } catch {
    return val
  }
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entityType, setEntityType] = useState("ALL")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

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
    <div className="min-h-screen bg-[#0a0c10] text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-gray-400 text-sm mt-1">
          {loading ? "Loading…" : `${totalElements.toLocaleString()} log entries`}
        </p>
      </div>

      {/* Entity type filter */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {ENTITY_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
              entityType === t
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
            }`}
          >
            {t === "ALL" ? "All Types" : t}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-400 text-sm text-center">{error}</div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading audit logs…</div>
      ) : logs.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-500">No audit logs found</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const isExpanded = expanded === log.id
            const old = formatValue(log.oldValue)
            const nw = formatValue(log.newValue)
            const hasDetail = old || nw || log.reason
            return (
              <div
                key={log.id}
                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
              >
                <div
                  className={`px-4 py-3 flex items-start gap-3 ${hasDetail ? "cursor-pointer hover:bg-white/8" : ""}`}
                  onClick={() => hasDetail && setExpanded(isExpanded ? null : log.id)}
                >
                  {/* Action badge */}
                  <span className="mt-0.5 shrink-0 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 text-xs font-mono font-semibold uppercase">
                    {log.action}
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <span className="text-sm font-medium text-white">
                        {log.entityName ?? log.entityType}
                      </span>
                      {log.entityType && (
                        <span className="text-xs text-gray-500 font-mono">[{log.entityType}]</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500 space-x-2">
                      {log.actorEmail && <span>{log.actorEmail}</span>}
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {hasDetail && (
                    <span className="shrink-0 text-xs text-gray-600 mt-1">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  )}
                </div>

                {isExpanded && hasDetail && (
                  <div className="border-t border-white/10 px-4 py-3 space-y-3">
                    {log.reason && (
                      <p className="text-xs text-gray-400">
                        <span className="text-gray-600 uppercase text-[10px] tracking-wider">Reason: </span>
                        {log.reason}
                      </p>
                    )}
                    {old && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Before</p>
                        <pre className="rounded-lg bg-red-500/5 border border-red-500/15 px-3 py-2 text-xs text-gray-400 overflow-auto max-h-48">
                          {old}
                        </pre>
                      </div>
                    )}
                    {nw && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">After</p>
                        <pre className="rounded-lg bg-green-500/5 border border-green-500/15 px-3 py-2 text-xs text-gray-400 overflow-auto max-h-48">
                          {nw}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <span className="text-sm text-gray-400">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 px-4 py-2 text-sm text-white transition"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 px-4 py-2 text-sm text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
