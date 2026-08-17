import { Search, Plus, ChevronLeft, ChevronRight, Users as UsersIcon } from "lucide-react";
import type { UserSummary } from "../api/userManagement.api";
import { resolveAvatarSrc } from "../../Profile/constants/avatars";

/* ============================================================================
   MobileUserManagement — mobile (<=950px) companion to UserManagementPage.tsx,
   following the same real-data/CSS-toggle pattern as MobileDashboard, and the
   same single-line row-card technique as MobileRobotManagement/
   MobileTeamManagement (there's no separate pasted Figma export for this
   page, so it's built consistent with those siblings rather than a mock).

   - Guaranteed-visible minimum: username, BotLeague ID, role, status — all
     always shown on the one row regardless of width. Phone is a bonus field
     that only shows up once the row has more room.
   - profilePhotoUrl goes through resolveAvatarSrc() rather than being used
     as a raw <img src> — it may be a real CDN URL, or an "avatar:<key>"
     sentinel for a predefined avatar the user picked in their profile
     (see Profile/constants/avatars.ts), which isn't a loadable URL by
     itself. Falls back to initials only when there's truly no photo or
     selected avatar.
   - Desktop has no status/role filter UI for this page (search only), so
     this doesn't invent filter pills that wire to nothing.
   - Numbered pagination reuses the desktop page's own windowed
     first/last/current +/-1 algorithm (passed down as `pageNumbers`).
   ============================================================================ */

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#1fa952",
  PENDING: "#a16207",
};

function avatarInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export interface MobileUserManagementProps {
  users: UserSummary[];
  loading: boolean;
  error: string | null;
  totalElements: number;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  page: number;
  totalPages: number;
  pageNumbers: number[];
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSelect: (page: number) => void;
  onRowClick: (userId: string) => void;
  onCreateUser: () => void;
}

export default function MobileUserManagement({
  users,
  loading,
  error,
  totalElements,
  search,
  onSearchChange,
  onSearchSubmit,
  page,
  totalPages,
  pageNumbers,
  onPrevPage,
  onNextPage,
  onPageSelect,
  onRowClick,
  onCreateUser,
}: MobileUserManagementProps) {
  return (
    <div className="mum-root">
      <div className="mum-header">
        <div>
          <h1>User Management</h1>
          <p>{totalElements} user{totalElements !== 1 ? "s" : ""} registered</p>
        </div>
        <button type="button" className="mum-create-btn" onClick={onCreateUser}>
          <Plus size={15} /> New
        </button>
      </div>

      <div className="mum-search">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
          placeholder="Search by name, email, phone, or BotLeague ID…"
        />
        <button type="button" className="mum-search-btn" onClick={onSearchSubmit} aria-label="Search">
          <Search size={16} />
        </button>
      </div>

      {error ? (
        <div className="mum-empty mum-error">{error}</div>
      ) : loading ? (
        <div className="mum-skeleton-list">
          {[1, 2, 3].map((i) => <div key={i} className="mum-skeleton" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="mum-empty">No users found</div>
      ) : (
        <div className="mum-list">
          {users.map((user) => {
            const name = `${user.firstName} ${user.lastName}`.trim() || user.username;
            const avatarSrc = resolveAvatarSrc(user.profilePhotoUrl);
            return (
              <button type="button" key={user.id} className="mum-row-card" onClick={() => onRowClick(user.id)}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt={name} className="mum-avatar" />
                ) : (
                  <span className="mum-avatar mum-avatar-fallback">{avatarInitials(user.firstName, user.lastName)}</span>
                )}
                <span className="mum-name">{name}</span>
                <span className="mum-field mum-field-code">{user.botleagueId}</span>
                <span className="mum-field mum-field-dot mum-field-role">·</span>
                <span className="mum-field mum-field-role">{user.primaryRole.replace(/_/g, " ")}</span>
                <span className="mum-field mum-field-dot mum-field-phone">·</span>
                <span className="mum-field mum-field-phone">{user.phone || "—"}</span>
                <span
                  className="mum-status-badge"
                  style={{ background: STATUS_COLORS[user.accountStatus] ?? "#e04b4b" }}
                >
                  {user.accountStatus}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mum-pagination">
          <button type="button" className="mum-page-arrow" disabled={page === 0} onClick={onPrevPage} aria-label="Previous page">
            <ChevronLeft size={15} />
          </button>
          {pageNumbers.map((p, i) => (
            <span key={p} className="mum-page-num-wrap">
              {i > 0 && p - pageNumbers[i - 1] > 1 && <span className="mum-page-dots">…</span>}
              <button
                type="button"
                className={p === page ? "mum-page-num mum-page-num-active" : "mum-page-num"}
                onClick={() => onPageSelect(p)}
              >
                {p + 1}
              </button>
            </span>
          ))}
          <button type="button" className="mum-page-arrow" disabled={page >= totalPages - 1} onClick={onNextPage} aria-label="Next page">
            <ChevronRight size={15} />
          </button>
        </div>
      )}
      {!loading && totalElements > 0 && (
        <div className="mum-total"><UsersIcon size={12} /> {totalElements} total</div>
      )}
    </div>
  );
}
