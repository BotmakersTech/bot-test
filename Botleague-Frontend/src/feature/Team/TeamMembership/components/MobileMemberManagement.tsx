import { ChevronLeft, RefreshCw } from "lucide-react";

/* ============================================================================
   MobileMemberManagement — mobile (<=950px) companion to
   MemberManagementPage.tsx, following the same real-data/CSS-toggle pattern
   as MobileMyTeam: both layouts render at once off the same page state, a
   CSS media query at 950px (teamdash-desktop-only / teamdash-mobile-only,
   already shared with MyTeam.tsx) picks which one is visible. Ported
   pixel-for-pixel from the pasted "Membermanagementmobile.jsx" mock
   (Sarpanch/Poppins/Inter, the #0162d1->#8c6cff gradient, card/pill/button
   treatment) — no page-level top bar, since Layout.tsx already renders one.

   Differs from the mock on purpose:
   - The mock's role control is a plain button labelled with the member's
     current role — this page's real role change is a <select> of the OTHER
     assignable roles (desktop's exact, already-working interaction model),
     so instead the current role shows as its own read-only pill (reusing
     desktop's .memmgmt-role-pill) and the change-role <select> is a
     separate control next to it, only for rows the viewer can actually act
     on.
   - "Search Members" wasn't backed by anything on desktop — wired here to a
     real client-side filter over the already-loaded roster (mobile-only;
     desktop's own list is untouched) instead of a dead input.
   - "featured" gradient row styling goes to the team's Captain, since that's
     the one role every viewer would want to spot at a glance.
   ============================================================================ */

export interface MobileMemberManagementRoleOption {
  value: string;
  label: string;
}

export interface MobileMemberManagementRow {
  userId: string;
  name: string;
  initials: string;
  photoSrc: string | null;
  roleLabel: string;
  roleClass: string;
  featured: boolean;

  showActions: boolean;
  roleOptions: MobileMemberManagementRoleOption[];
  onChangeRole: (role: string) => void;
  actionLoading: boolean;

  canMakeCaptain: boolean;
  confirmingCaptain: boolean;
  onStartMakeCaptain: () => void;
  onConfirmMakeCaptain: () => void;
  onCancelMakeCaptain: () => void;

  isRemoving: boolean;
  confirmingRemove: boolean;
  onStartRemove: () => void;
  onConfirmRemove: () => void;
  onCancelRemove: () => void;
}

export interface MobileMemberManagementProps {
  onBack: () => void;
  error: string | null;
  onRetry: () => void;
  loading: boolean;

  isAdmin: boolean;
  botleagueId: string;
  onBotleagueIdChange: (value: string) => void;
  inviteRole: string;
  onInviteRoleChange: (value: string) => void;
  inviteRoleOptions: MobileMemberManagementRoleOption[];
  inviteLoading: boolean;
  inviteMessage: string | null;
  onInvite: () => void;

  searchQuery: string;
  onSearchQueryChange: (value: string) => void;

  totalMemberCount: number;
  rows: MobileMemberManagementRow[];
}

export default function MobileMemberManagement({
  onBack,
  error,
  onRetry,
  loading,
  isAdmin,
  botleagueId,
  onBotleagueIdChange,
  inviteRole,
  onInviteRoleChange,
  inviteRoleOptions,
  inviteLoading,
  inviteMessage,
  onInvite,
  searchQuery,
  onSearchQueryChange,
  totalMemberCount,
  rows,
}: MobileMemberManagementProps) {
  return (
    <div className="mmm-root">
      <div className="mmm-header-row">
        <button type="button" className="mmm-back-btn" aria-label="Back" onClick={onBack}>
          <ChevronLeft size={20} color="#0162d1" />
        </button>
        <h1 className="mmm-title">Member Management</h1>
      </div>
      <div className="mmm-underline" />

      {error && (
        <div className="teamdash-error" style={{ marginBottom: 14 }}>
          <span>{error}</span>
          <button type="button" onClick={onRetry}>
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="mmm-card">
          <p className="mmm-card-label">Invite Members</p>
          <div className="mmm-card-row">
            <div className="mmm-input-shell">
              <input
                placeholder="Search by BotLeague ID"
                value={botleagueId}
                onChange={(e) => onBotleagueIdChange(e.target.value)}
              />
            </div>
            <select
              className="mmm-role-mini-select"
              value={inviteRole}
              onChange={(e) => onInviteRoleChange(e.target.value)}
              aria-label="Invite role"
            >
              {inviteRoleOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              type="button"
              className="mmm-action-btn"
              disabled={!botleagueId.trim() || inviteLoading}
              onClick={onInvite}
            >
              {inviteLoading ? "…" : "Invite"}
            </button>
          </div>
          {inviteMessage && <span className="mmm-invite-message">{inviteMessage}</span>}
        </div>
      )}

      <div className="mmm-card">
        <p className="mmm-card-label">Search Members</p>
        <div className="mmm-card-row">
          <div className="mmm-input-shell">
            <input
              placeholder="Search by name or role"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <p className="mmm-team-title">Team ({totalMemberCount})</p>

      {loading && rows.length === 0 ? (
        <div className="teamdash-empty-list">Loading members...</div>
      ) : rows.length === 0 ? (
        <div className="teamdash-empty-list">
          {searchQuery.trim() ? "No members match your search." : "No members yet."}
        </div>
      ) : (
        rows.map((m) => (
          <div key={m.userId}>
            <div className={m.featured ? "mmm-member featured" : "mmm-member"}>
              {m.photoSrc ? (
                <img src={m.photoSrc} alt={m.name} className="mmm-member-avatar" />
              ) : (
                <span className="mmm-member-avatar">{m.initials}</span>
              )}
              <p className="mmm-member-name">{m.name}</p>
              <span className={`memmgmt-role-pill ${m.roleClass}`} style={{ marginLeft: "auto", marginTop: 0 }}>
                {m.roleLabel}
              </span>
            </div>

            {m.showActions && (
              <div className="mmm-member-actions">
                <select
                  className="memmgmt-action-select"
                  defaultValue=""
                  disabled={m.actionLoading}
                  onChange={(e) => {
                    const role = e.target.value;
                    if (!role) return;
                    e.target.value = "";
                    m.onChangeRole(role);
                  }}
                >
                  <option value="" disabled>Change role</option>
                  {m.roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                {m.canMakeCaptain && (
                  m.confirmingCaptain ? (
                    <>
                      <span className="memmgmt-confirm-text">Make captain?</span>
                      <button type="button" className="memmgmt-captain-btn" disabled={m.actionLoading} onClick={m.onConfirmMakeCaptain}>
                        Confirm
                      </button>
                      <button type="button" className="memmgmt-cancel-btn" onClick={m.onCancelMakeCaptain}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" className="memmgmt-captain-btn" onClick={m.onStartMakeCaptain}>
                      Make Captain
                    </button>
                  )
                )}

                {m.confirmingRemove ? (
                  <>
                    <span className="memmgmt-confirm-text">Remove?</span>
                    <button type="button" className="memmgmt-remove-btn" disabled={m.isRemoving} onClick={m.onConfirmRemove}>
                      Confirm
                    </button>
                    <button type="button" className="memmgmt-cancel-btn" onClick={m.onCancelRemove}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" className="memmgmt-remove-btn" onClick={m.onStartRemove}>
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {!isAdmin && (
        <div className="memmgmt-readonly-note">Only the captain or vice-captain can manage members.</div>
      )}
    </div>
  );
}
