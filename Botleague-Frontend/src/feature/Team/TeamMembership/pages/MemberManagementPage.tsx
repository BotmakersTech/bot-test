import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import useTeam from "../../hooks/useTeam";
import useTeamMembership from "../hooks/useTeamMembership";
import { resolveAvatarSrc } from "../../../Profile/constants/avatars";
import type { TeamMember, TeamRole } from "../api/teamMembership.api";
import MobileMemberManagement, { type MobileMemberManagementRow } from "../components/MobileMemberManagement";
import "../../../../styles/teamDashboard.css";
import "../../../../styles/memberManagement.css";

const INVITE_ROLE_OPTIONS: TeamRole[] = ["MEMBER", "VICE_CAPTAIN", "MENTOR"];
const ASSIGNABLE_ROLES: TeamRole[] = ["VICE_CAPTAIN", "MEMBER", "MENTOR"];

function memberName(member: TeamMember): string {
  return (
    member.username ||
    [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
    member.botleagueId ||
    "Team member"
  );
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "T") + (parts[1]?.[0] ?? "");
}

function roleLabel(role?: TeamRole | string): string {
  return String(role ?? "").replace("_", " ");
}

export default function MemberManagementPage() {
  const navigate = useNavigate();
  const { team, isLoading: teamLoading } = useTeam();
  const teamCode = team?.teamCode || "";

  const {
    authUser,
    members,
    isCaptain,
    isAdmin,
    loading,
    inviteLoading,
    actionLoading,
    removingMemberId,
    error,
    inviteMember,
    assignRole,
    removeMember,
    transferCaptain,
  } = useTeamMembership(teamCode);

  const [botleagueId, setBotleagueId] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("MEMBER");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmCaptainId, setConfirmCaptainId] = useState<string | null>(null);
  // Mobile-only — desktop's roster has no search of its own.
  const [mobileSearch, setMobileSearch] = useState("");

  const handleInvite = async () => {
    const id = botleagueId.trim();
    if (!id) return;
    setInviteMessage(null);
    try {
      await inviteMember(id, inviteRole);
      setInviteMessage(`Invite sent to ${id}`);
      setBotleagueId("");
      setInviteRole("MEMBER");
    } catch {
      // error already surfaced via the shared error banner below
    }
  };

  const roleOptionsFor = (member: TeamMember): TeamRole[] => {
    const base = isCaptain
      ? ASSIGNABLE_ROLES
      : ASSIGNABLE_ROLES.filter((r) => r !== "VICE_CAPTAIN");
    return base.filter((r) => r !== member.teamRole);
  };

  if (teamLoading && !team) {
    return (
      <main className="teamdash-page teamdash-state">
        <div className="teamdash-spinner" />
        <p>Loading your team...</p>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="teamdash-page teamdash-state">
        <h1>No active team found</h1>
        <p>Create a team or accept an invitation to manage members.</p>
        <div className="teamdash-state-actions">
          <button type="button" onClick={() => navigate("/create-team")}>Create Team</button>
        </div>
      </main>
    );
  }

  const mobileQuery = mobileSearch.trim().toLowerCase();
  const mobileMembers = mobileQuery
    ? members.filter((member) => {
        const name = memberName(member).toLowerCase();
        const role = roleLabel(member.teamRole).toLowerCase();
        return name.includes(mobileQuery) || role.includes(mobileQuery) || (member.botleagueId ?? "").toLowerCase().includes(mobileQuery);
      })
    : members;

  const mobileRows: MobileMemberManagementRow[] = mobileMembers.map((member) => {
    const name = memberName(member);
    const isSelf = member.userId === authUser?.id;
    const isTargetCaptain = member.teamRole === "CAPTAIN";
    const showActions = isAdmin && !isSelf && !isTargetCaptain;

    return {
      userId: member.userId,
      name,
      initials: memberInitials(name),
      photoSrc: resolveAvatarSrc(member.profilePhotoUrl),
      roleLabel: roleLabel(member.teamRole),
      roleClass: (member.teamRole || "").toLowerCase(),
      featured: isTargetCaptain,

      showActions,
      roleOptions: roleOptionsFor(member).map((r) => ({ value: r, label: roleLabel(r) })),
      onChangeRole: (role) => { assignRole(member.userId, role as TeamRole).catch(() => {}); },
      actionLoading,

      canMakeCaptain: isCaptain,
      confirmingCaptain: confirmCaptainId === member.userId,
      onStartMakeCaptain: () => setConfirmCaptainId(member.userId),
      onConfirmMakeCaptain: () => {
        transferCaptain(member.userId).catch(() => {}).finally(() => setConfirmCaptainId(null));
      },
      onCancelMakeCaptain: () => setConfirmCaptainId(null),

      isRemoving: removingMemberId === member.userId,
      confirmingRemove: confirmRemoveId === member.userId,
      onStartRemove: () => setConfirmRemoveId(member.userId),
      onConfirmRemove: () => {
        removeMember(member.userId).catch(() => {}).finally(() => setConfirmRemoveId(null));
      },
      onCancelRemove: () => setConfirmRemoveId(null),
    };
  });

  return (
    <>
    <main className="teamdash-page teamdash-desktop-only">
      <div className="teamdash-content">
        <div className="teamdash-top-row">
          <h1>Member Management</h1>
          <button type="button" className="teamdash-chat-btn" onClick={() => navigate("/my-team")}>
            Back
          </button>
        </div>

        {error && (
          <div className="teamdash-error">
            <span>{error}</span>
            <button type="button" onClick={() => window.location.reload()}>
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        {isAdmin && (
          <section className="teamdash-squad-panel memmgmt-search-card" style={{ marginBottom: "24px" }}>
            <label htmlFor="memmgmt-invite-id">Search by BotLeague ID</label>
            <div className="memmgmt-search-row">
              <input
                id="memmgmt-invite-id"
                className="memmgmt-input"
                placeholder="e.g. BLU2612345"
                value={botleagueId}
                onChange={(e) => setBotleagueId(e.target.value)}
              />
              <select
                className="memmgmt-role-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamRole)}
              >
                {INVITE_ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{roleLabel(r)}</option>
                ))}
              </select>
              <button
                type="button"
                className="teamdash-chat-btn memmgmt-invite-btn"
                disabled={!botleagueId.trim() || inviteLoading}
                onClick={handleInvite}
              >
                {inviteLoading ? "Sending..." : "Invite"}
              </button>
            </div>
            {inviteMessage && <span className="memmgmt-invite-message">{inviteMessage}</span>}
          </section>
        )}

        <section className="teamdash-squad-panel">
          <h2>Team ({members.length})</h2>
          <div className="teamdash-member-list">
            {loading && members.length === 0 ? (
              <div className="teamdash-empty-list">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="teamdash-empty-list">No members yet.</div>
            ) : (
              members.map((member) => {
                const name = memberName(member);
                const photoSrc = resolveAvatarSrc(member.profilePhotoUrl);
                const isSelf = member.userId === authUser?.id;
                const isTargetCaptain = member.teamRole === "CAPTAIN";
                const showActions = isAdmin && !isSelf && !isTargetCaptain;
                const isRemoving = removingMemberId === member.userId;

                return (
                  <div className="teamdash-member memmgmt-roster-row" key={member.userId}>
                    {photoSrc ? (
                      <img src={photoSrc} alt={name} className="teamdash-avatar" />
                    ) : (
                      <span className="teamdash-avatar teamdash-avatar-fallback">{memberInitials(name)}</span>
                    )}
                    <div className="teamdash-member-info">
                      <strong>{name}</strong>
                      <span className={`memmgmt-role-pill ${(member.teamRole || "").toLowerCase()}`}>
                        {roleLabel(member.teamRole)}
                      </span>
                    </div>

                    {showActions && (
                      <div className="memmgmt-row-actions">
                        <select
                          className="memmgmt-action-select"
                          defaultValue=""
                          disabled={actionLoading}
                          onChange={async (e) => {
                            const role = e.target.value as TeamRole;
                            if (!role) return;
                            e.target.value = "";
                            try {
                              await assignRole(member.userId, role);
                            } catch {
                              // error already surfaced via the shared error banner
                            }
                          }}
                        >
                          <option value="" disabled>Change role</option>
                          {roleOptionsFor(member).map((r) => (
                            <option key={r} value={r}>{roleLabel(r)}</option>
                          ))}
                        </select>

                        {isCaptain && (
                          confirmCaptainId === member.userId ? (
                            <>
                              <span className="memmgmt-confirm-text">Make captain?</span>
                              <button
                                type="button"
                                className="memmgmt-captain-btn"
                                disabled={actionLoading}
                                onClick={async () => {
                                  try {
                                    await transferCaptain(member.userId);
                                  } catch {
                                    // error already surfaced via the shared error banner
                                  } finally {
                                    setConfirmCaptainId(null);
                                  }
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="memmgmt-cancel-btn"
                                onClick={() => setConfirmCaptainId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="memmgmt-captain-btn"
                              onClick={() => setConfirmCaptainId(member.userId)}
                            >
                              Make Captain
                            </button>
                          )
                        )}

                        {confirmRemoveId === member.userId ? (
                          <>
                            <span className="memmgmt-confirm-text">Remove?</span>
                            <button
                              type="button"
                              className="memmgmt-remove-btn"
                              disabled={isRemoving}
                              onClick={async () => {
                                try {
                                  await removeMember(member.userId);
                                } catch {
                                  // error already surfaced via the shared error banner
                                } finally {
                                  setConfirmRemoveId(null);
                                }
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="memmgmt-cancel-btn"
                              onClick={() => setConfirmRemoveId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="memmgmt-remove-btn"
                            onClick={() => setConfirmRemoveId(member.userId)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {!isAdmin && (
            <div className="memmgmt-readonly-note">Only the captain or vice-captain can manage members.</div>
          )}
        </section>
      </div>
    </main>

    <div className="teamdash-mobile-only">
      <MobileMemberManagement
        onBack={() => navigate("/my-team")}
        error={error}
        onRetry={() => window.location.reload()}
        loading={loading}
        isAdmin={isAdmin}
        botleagueId={botleagueId}
        onBotleagueIdChange={setBotleagueId}
        inviteRole={inviteRole}
        onInviteRoleChange={(role) => setInviteRole(role as TeamRole)}
        inviteRoleOptions={INVITE_ROLE_OPTIONS.map((r) => ({ value: r, label: roleLabel(r) }))}
        inviteLoading={inviteLoading}
        inviteMessage={inviteMessage}
        onInvite={handleInvite}
        searchQuery={mobileSearch}
        onSearchQueryChange={setMobileSearch}
        totalMemberCount={members.length}
        rows={mobileRows}
      />
    </div>
    </>
  );
}
