import type { AuditLogEntry } from "../api/auditLog.api";

/* ============================================================================
   MobileAuditLogs — mobile (<=950px) companion to AdminAuditLogsPage.tsx,
   following the same real-data/CSS-toggle pattern as MobileDashboard.

   Differs from the pasted "Auditlogmobile.jsx" Figma export on purpose:
   - That mock used a fixed-height absolute-positioned canvas sized for
     exactly 2 hardcoded cards. Audit log pages are a paginated list of
     variable length (0-25 real entries), so a fixed canvas doesn't fit —
     this uses a normal flowing card list instead, keeping the mock's visual
     language (pill filters, gradient action badge, before/after chips).
   - No page-level top bar / "Create Team" CTA — Layout.tsx already renders
     the app header, and a create-team button has no relationship to an
     audit log entry (it was a leftover from whatever template the mock was
     drafted from).
   - Entity-type filter pills use the real 8-value ENTITY_TYPES list (not
     the mock's decorative "Users / Roles / Date Range"), and before/after
     values are the real oldValue/newValue diff strings, not literal
     "pending_approval" / "Approved" text.
   ============================================================================ */

const ENTITY_TYPES = ["ALL", "USER", "TEAM", "ROBOT", "EVENT", "MATCH", "REGISTRATION", "SPONSOR"];
const ENTITY_LABELS: Record<string, string> = {
  ALL: "All Types", USER: "User", TEAM: "Team", ROBOT: "Robot",
  EVENT: "Techfest", MATCH: "Match", REGISTRATION: "Registration", SPONSOR: "Sponsor",
};

function humanize(raw: string): string {
  return raw.replace(/_/g, " ");
}

function formatValue(val?: string | null): string | null {
  if (!val) return null;
  try {
    return JSON.stringify(JSON.parse(val));
  } catch {
    return val;
  }
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function LogCard({ log }: { log: AuditLogEntry }) {
  const old = formatValue(log.oldValue);
  const nw = formatValue(log.newValue);
  const { date, time } = fmtDateTime(log.createdAt);

  return (
    <div className="mal-card">
      <div className="mal-card-top">
        <span className="mal-action-badge">{humanize(log.action)}</span>
        <span className="mal-datetime">{date} · {time}</span>
      </div>
      <div className="mal-entity">{log.entityName ?? log.entityType}</div>
      {log.actorEmail && <div className="mal-actor">{log.actorEmail}</div>}

      {(old || nw) && (
        <div className="mal-diff-row">
          {old && (
            <div className="mal-diff mal-diff-before">
              <span className="mal-diff-chip">Before</span>
              <p>{old}</p>
            </div>
          )}
          {nw && (
            <div className="mal-diff mal-diff-after">
              <span className="mal-diff-chip">After</span>
              <p>{nw}</p>
            </div>
          )}
        </div>
      )}

      {log.reason && <p className="mal-reason"><em>Reason:</em> {log.reason}</p>}
    </div>
  );
}

export interface MobileAuditLogsProps {
  logs: AuditLogEntry[];
  loading: boolean;
  error: string | null;
  entityType: string;
  onEntityTypeChange: (type: string) => void;
  page: number;
  totalPages: number;
  totalElements: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function MobileAuditLogs({
  logs,
  loading,
  error,
  entityType,
  onEntityTypeChange,
  page,
  totalPages,
  totalElements,
  onPrevPage,
  onNextPage,
}: MobileAuditLogsProps) {
  return (
    <div className="mal-root">
      <div className="mal-header">
        <h1>Audit Logs</h1>
        <p>{loading ? "Loading…" : `${totalElements.toLocaleString()} log entries`}</p>
      </div>

      <div className="mal-filters">
        {ENTITY_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={entityType === t ? "mal-pill mal-pill-active" : "mal-pill"}
            onClick={() => onEntityTypeChange(t)}
          >
            {ENTITY_LABELS[t]}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mal-empty mal-error">{error}</div>
      ) : loading ? (
        <div className="mal-skeleton-list">
          {[1, 2, 3].map((i) => <div key={i} className="mal-skeleton" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="mal-empty">No audit logs found</div>
      ) : (
        <div className="mal-list">
          {logs.map((log) => <LogCard key={log.id} log={log} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mal-pagination">
          <button type="button" disabled={page === 0} onClick={onPrevPage} className="mal-page-btn">Previous</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages - 1} onClick={onNextPage} className="mal-page-btn">Next</button>
        </div>
      )}
    </div>
  );
}
