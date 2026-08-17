import { Search, Users as UsersIcon } from "lucide-react";
import type { UserSummary } from "../../SuperAdmin/api/userManagement.api";
import { resolveAvatarSrc } from "../../Profile/constants/avatars";

/* ============================================================================
   MobileJudgeEcosystem — mobile (<=950px) companion to AdminJudgesPage.tsx,
   following the same real-data/CSS-toggle pattern as MobileDashboard, and the
   same single-line row-card technique as MobileUserManagement (judges are
   just users filtered to the JUDGE role, so the row shape matches exactly:
   name, BotLeague ID, role, status always visible; phone is a bonus field
   once the row has more room).

   - profilePhotoUrl goes through resolveAvatarSrc() rather than a raw
     <img src> — same reasoning as MobileUserManagement (it may be an
     "avatar:<key>" sentinel for a predefined avatar, not a loadable URL).
   - No pagination and no "create" button here — the desktop page has
     neither (judges load up to 100 at once; the JUDGE role itself is
     assigned from User Management, not created here), so this doesn't
     invent controls that wire to nothing.
   - The informational banner ("Judges are users with the JUDGE role...")
     is real content from the desktop page, ported rather than dropped.
   ============================================================================ */

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#1fa952",
  PENDING: "#a16207",
};

function avatarInitials(firstName?: string, lastName?: string, fallback?: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  return initials || fallback?.charAt(0).toUpperCase() || "?";
}

export interface MobileJudgeEcosystemProps {
  judges: UserSummary[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onRowClick: (userId: string) => void;
  onManageRoles: () => void;
}

export default function MobileJudgeEcosystem({
  judges,
  loading,
  error,
  search,
  onSearchChange,
  onSearchSubmit,
  onRowClick,
  onManageRoles,
}: MobileJudgeEcosystemProps) {
  return (
    <div className="mjg-root">
      <div className="mal-header">
        <h1>Judge Ecosystem</h1>
        <p>{loading ? "Loading…" : `${judges.length} user${judges.length !== 1 ? "s" : ""} with judge-level access`}</p>
      </div>

      <div className="mjg-notice">
        Judges are users with the <strong>JUDGE</strong> role. Assign roles via{" "}
        <button type="button" onClick={onManageRoles}>User Management</button>.
      </div>

      <div className="mjg-search">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
          placeholder="Search by name or email…"
        />
        <button type="button" className="mjg-search-btn" onClick={onSearchSubmit} aria-label="Search">
          <Search size={16} />
        </button>
      </div>

      {error ? (
        <div className="mjg-empty mjg-error">{error}</div>
      ) : loading ? (
        <div className="mjg-skeleton-list">
          {[1, 2, 3].map((i) => <div key={i} className="mjg-skeleton" />)}
        </div>
      ) : judges.length === 0 ? (
        <div className="mjg-empty">
          No judges found.{" "}
          <button type="button" onClick={onManageRoles} className="mjg-empty-link">
            Assign roles in User Management →
          </button>
        </div>
      ) : (
        <div className="mjg-list">
          {judges.map((u) => {
            const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "—";
            const avatarSrc = resolveAvatarSrc(u.profilePhotoUrl);
            return (
              <button type="button" key={u.id} className="mjg-row-card" onClick={() => onRowClick(u.id)}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt={name} className="mjg-avatar" />
                ) : (
                  <span className="mjg-avatar mjg-avatar-fallback">{avatarInitials(u.firstName, u.lastName, u.email)}</span>
                )}
                <span className="mjg-name">{name}</span>
                <span className="mjg-field mjg-field-code">{u.botleagueId}</span>
                <span className="mjg-field mjg-field-dot mjg-field-role">·</span>
                <span className="mjg-field mjg-field-role">{u.primaryRole.replace(/_/g, " ")}</span>
                <span className="mjg-field mjg-field-dot mjg-field-phone">·</span>
                <span className="mjg-field mjg-field-phone">{u.phone || "—"}</span>
                <span
                  className="mjg-status-badge"
                  style={{ background: STATUS_COLORS[u.accountStatus] ?? "#e04b4b" }}
                >
                  {u.accountStatus}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!loading && !error && judges.length > 0 && (
        <div className="mjg-total"><UsersIcon size={12} /> {judges.length} total</div>
      )}
    </div>
  );
}
