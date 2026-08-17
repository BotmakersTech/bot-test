import { Search, Plus, ChevronLeft, ChevronRight, Bot as BotIcon } from "lucide-react";
import type { AdminRobotSummary } from "../../SuperAdmin/api/robotManagement.api";

/* ============================================================================
   MobileRobotManagement — mobile (<=950px) companion to AdminRobotsPage.tsx,
   following the same real-data/CSS-toggle pattern as MobileDashboard.

   Differs from the pasted "Robotmanagement.jsx" Figma export on purpose:
   - That mock's 5-column table (code/type/weight/status/view) is ported as a
     stacked card per robot instead of a fixed-width grid row — a real robot
     name/team/sport can run much longer than the mock's uniform "BLU0356648"
     placeholder, and mobile has no room for 5 side-by-side columns anyway.
   - The mock's two decorative "Select from.. / Types.." dropdowns become the
     real STATUSES + ROBOT_TYPES filter pill rows the desktop page already
     has (dropdowns with no wired data would be dead UI).
   - Numbered pagination reuses the desktop page's own windowed
     first/last/current +/-1 algorithm (`pageNumbers`) instead of the mock's
     hardcoded "1 2 3 4 ... 10".
   ============================================================================ */

const STATUSES = ["ALL", "ACTIVE", "INACTIVE", "MAINTENANCE"];
const ROBOT_TYPES = ["ALL", "COMBAT_ROBOT", "SOCCER_ROBOT", "SUMO_ROBOT", "LINE_FOLLOWER_ROBOT",
  "RC_VEHICLE", "DRONE"];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#1fa952",
  INACTIVE: "#9ca3af",
  MAINTENANCE: "#a16207",
};

export interface MobileRobotManagementProps {
  robots: AdminRobotSummary[];
  loading: boolean;
  error: string | null;
  totalElements: number;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  page: number;
  totalPages: number;
  pageNumbers: number[];
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSelect: (page: number) => void;
  onRowClick: (robotId: string) => void;
  onCreateRobot: () => void;
}

export default function MobileRobotManagement({
  robots,
  loading,
  error,
  totalElements,
  search,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  page,
  totalPages,
  pageNumbers,
  onPrevPage,
  onNextPage,
  onPageSelect,
  onRowClick,
  onCreateRobot,
}: MobileRobotManagementProps) {
  return (
    <div className="mrm-root">
      <div className="mrm-header">
        <div>
          <h1>Robot Management</h1>
          <p>{totalElements} robot{totalElements !== 1 ? "s" : ""} registered</p>
        </div>
        <button type="button" className="mrm-create-btn" onClick={onCreateRobot}>
          <Plus size={15} /> Create
        </button>
      </div>

      <div className="mrm-search">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
          placeholder="Search by robot name…"
        />
        <button type="button" className="mrm-search-btn" onClick={onSearchSubmit} aria-label="Search">
          <Search size={16} />
        </button>
      </div>

      <div className="mrm-filters">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={statusFilter === s ? "mrm-pill mrm-pill-active" : "mrm-pill"}
            onClick={() => onStatusFilterChange(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mrm-filters mrm-filters-scroll">
        {ROBOT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={typeFilter === t ? "mrm-type-pill mrm-type-pill-active" : "mrm-type-pill"}
            onClick={() => onTypeFilterChange(t)}
          >
            {t === "ALL" ? "All Types" : t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mrm-empty mrm-error">{error}</div>
      ) : loading ? (
        <div className="mrm-skeleton-list">
          {[1, 2, 3].map((i) => <div key={i} className="mrm-skeleton" />)}
        </div>
      ) : robots.length === 0 ? (
        <div className="mrm-empty">No robots found</div>
      ) : (
        <div className="mrm-list">
          {robots.map((robot) => (
            <button type="button" key={robot.id} className="mrm-row-card" onClick={() => onRowClick(robot.id)}>
              {robot.robotIMG ? (
                <img src={robot.robotIMG} alt={robot.robotName} className="mrm-avatar" />
              ) : (
                <span className="mrm-avatar mrm-avatar-fallback">{robot.robotName.charAt(0)}</span>
              )}
              <span className="mrm-name">{robot.robotName}</span>
              <span className="mrm-field mrm-field-code">{robot.robotCode}</span>
              <span className="mrm-field mrm-field-dot mrm-field-type">·</span>
              <span className="mrm-field mrm-field-type">{robot.robotType?.replace(/_/g, " ") ?? "—"}</span>
              <span className="mrm-field mrm-field-dot mrm-field-weight">·</span>
              <span className="mrm-field mrm-field-weight">
                {robot.weightClass ?? (robot.weightKg ? `${robot.weightKg} kg` : "—")}
              </span>
              <span
                className="mrm-status-badge"
                style={{ background: STATUS_COLORS[robot.status] ?? "#9ca3af" }}
              >
                {robot.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mrm-pagination">
          <button type="button" className="mrm-page-arrow" disabled={page === 0} onClick={onPrevPage} aria-label="Previous page">
            <ChevronLeft size={15} />
          </button>
          {pageNumbers.map((p, i) => (
            <span key={p} className="mrm-page-num-wrap">
              {i > 0 && p - pageNumbers[i - 1] > 1 && <span className="mrm-page-dots">…</span>}
              <button
                type="button"
                className={p === page ? "mrm-page-num mrm-page-num-active" : "mrm-page-num"}
                onClick={() => onPageSelect(p)}
              >
                {p + 1}
              </button>
            </span>
          ))}
          <button type="button" className="mrm-page-arrow" disabled={page >= totalPages - 1} onClick={onNextPage} aria-label="Next page">
            <ChevronRight size={15} />
          </button>
        </div>
      )}
      {!loading && totalElements > 0 && (
        <div className="mrm-total"><BotIcon size={12} /> {totalElements} total</div>
      )}
    </div>
  );
}
