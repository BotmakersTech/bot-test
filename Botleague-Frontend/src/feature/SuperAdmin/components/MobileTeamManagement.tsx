import { Search, Plus, ChevronLeft, ChevronRight, Users as UsersIcon } from "lucide-react";
import type { AdminTeamSummary } from "../api/teamManagement.api";
import TeamLogo from "../../../shared/components/TeamLogo";

/* ============================================================================
   MobileTeamManagement — mobile (<=950px) companion to TeamManagementPage.tsx,
   following the same real-data/CSS-toggle pattern as MobileDashboard.

   Differs from the pasted "TeamManagementMobile.jsx" Figma export on purpose:
   - That mock's 5-column table ("Profile Details / Team / No. / Status /
     Joining") appears to describe team *members*, not the admin's real Team
     Management data (AdminTeamSummary: teamName/teamCode/institutionName/
     city/country/memberCount/status/createdAt — one row per TEAM). Ported as
     a stacked card per team instead, using the real fields, rather than
     inventing member-level data this page doesn't have.
   - The mock's second "Types..." dropdown has no real backing filter on this
     page (only a status filter exists) — dropped rather than wired to
     nothing, same reasoning MobileDashboard used to skip non-functional
     mock elements.
   - Numbered pagination reuses the desktop page's own windowed
     first/last/current +/-1 algorithm (passed down as `pageNumbers`) instead
     of the mock's hardcoded "1 2 3 4 ... 10".
   ============================================================================ */

const STATUS_FILTERS = ["ALL", "PENDING", "ACTIVE", "REJECTED"];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#1fa952",
  PENDING: "#a16207",
  REJECTED: "#e04b4b",
};

export interface MobileTeamManagementProps {
  teams: AdminTeamSummary[];
  loading: boolean;
  error: string | null;
  totalElements: number;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  page: number;
  totalPages: number;
  pageNumbers: number[];
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSelect: (page: number) => void;
  onRowClick: (teamId: string) => void;
  onCreateTeam: () => void;
}

export default function MobileTeamManagement({
  teams,
  loading,
  error,
  totalElements,
  search,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
  page,
  totalPages,
  pageNumbers,
  onPrevPage,
  onNextPage,
  onPageSelect,
  onRowClick,
  onCreateTeam,
}: MobileTeamManagementProps) {
  return (
    <div className="mtm-root">
      <div className="mtm-header">
        <div>
          <h1>Team Management</h1>
          <p>{totalElements} team{totalElements !== 1 ? "s" : ""} registered</p>
        </div>
        <button type="button" className="mtm-create-btn" onClick={onCreateTeam}>
          <Plus size={15} /> Create
        </button>
      </div>

      <div className="mtm-search">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
          placeholder="Search by name, code, or institution…"
        />
        <button type="button" className="mtm-search-btn" onClick={onSearchSubmit} aria-label="Search">
          <Search size={16} />
        </button>
      </div>

      <div className="mtm-filters">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={statusFilter === s ? "mtm-pill mtm-pill-active" : "mtm-pill"}
            onClick={() => onStatusFilterChange(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mtm-empty mtm-error">{error}</div>
      ) : loading ? (
        <div className="mtm-skeleton-list">
          {[1, 2, 3].map((i) => <div key={i} className="mtm-skeleton" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="mtm-empty">No teams found</div>
      ) : (
        <div className="mtm-list">
          {teams.map((team) => (
            <button type="button" key={team.id} className="mtm-row-card" onClick={() => onRowClick(team.id)}>
              <TeamLogo src={team.logoUrl} alt={team.teamName} className="mtm-avatar" />
              <div className="mtm-row-body">
                <div className="mtm-row-top">
                  <span className="mtm-name">{team.teamName}</span>
                  <span
                    className="mtm-status-badge"
                    style={{ background: STATUS_COLORS[team.status] ?? "#9ca3af" }}
                  >
                    {team.status}
                  </span>
                </div>
                <div className="mtm-code">{team.teamCode}</div>
                <div className="mtm-meta-row">
                  <span>{team.institutionName || "—"}</span>
                  <span>·</span>
                  <span>{[team.city, team.country].filter(Boolean).join(", ") || "—"}</span>
                </div>
                <div className="mtm-meta-row">
                  <span className="mtm-members-badge"><UsersIcon size={11} /> {team.memberCount}</span>
                  <span>·</span>
                  <span>{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "—"}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mtm-pagination">
          <button type="button" className="mtm-page-arrow" disabled={page === 0} onClick={onPrevPage} aria-label="Previous page">
            <ChevronLeft size={15} />
          </button>
          {pageNumbers.map((p, i) => (
            <span key={p} className="mtm-page-num-wrap">
              {i > 0 && p - pageNumbers[i - 1] > 1 && <span className="mtm-page-dots">…</span>}
              <button
                type="button"
                className={p === page ? "mtm-page-num mtm-page-num-active" : "mtm-page-num"}
                onClick={() => onPageSelect(p)}
              >
                {p + 1}
              </button>
            </span>
          ))}
          <button type="button" className="mtm-page-arrow" disabled={page >= totalPages - 1} onClick={onNextPage} aria-label="Next page">
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
