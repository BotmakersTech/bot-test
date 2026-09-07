import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import useTeam from "../../hooks/useTeam";
import useTeamMembership from "../hooks/useTeamMembership";
import { resolveAvatarSrc } from "../../../Profile/constants/avatars";
import { ageCategoryFromDob } from "../../../../shared/utils/ageCategory";
import { ageGroupLabel } from "../../../../shared/utils/ageGroup";
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

/** The league (Ignite/Inferno/Apex) this member's age currently qualifies
 * them for, derived from date of birth the same way techsport eligibility
 * is — "—" when DOB isn't on file. */
function eligibleLeague(member: TeamMember): string {
  return ageGroupLabel(ageCategoryFromDob(member.dateOfBirth));
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
    leaveTeam,
  } = useTeamMembership(teamCode);

  const [botleagueId, setBotleagueId] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("MEMBER");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmCaptainId, setConfirmCaptainId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: string; role: TeamRole } | null>(null);
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

  const handleConfirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    try {
      await assignRole(pendingRoleChange.userId, pendingRoleChange.role);
    } catch {
      // error already surfaced via the shared error banner below
    } finally {
      setPendingRoleChange(null);
    }
  };

  const handleLeaveTeam = async () => {
    try {
      await leaveTeam();
      navigate("/my-team");
    } catch {
      // error already surfaced via the shared error banner below
    } finally {
      setConfirmLeave(false);
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
      league: eligibleLeague(member),
      featured: isTargetCaptain,

      showActions,
      roleOptions: roleOptionsFor(member).map((r) => ({ value: r, label: roleLabel(r) })),
      onChangeRole: (role) => setPendingRoleChange({ userId: member.userId, role: role as TeamRole }),
      actionLoading,

      confirmingRoleChange: pendingRoleChange?.userId === member.userId,
      pendingRoleLabel: pendingRoleChange?.userId === member.userId ? roleLabel(pendingRoleChange.role) : "",
      onConfirmRoleChange: handleConfirmRoleChange,
      onCancelRoleChange: () => setPendingRoleChange(null),

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
                      <span className="memmgmt-pill-row">
                        <span className={`memmgmt-role-pill ${(member.teamRole || "").toLowerCase()}`}>
                          {roleLabel(member.teamRole)}
                        </span>
                        <span className="memmgmt-league-pill">{eligibleLeague(member)}</span>
                      </span>
                    </div>

                    {showActions && (
                      <div className="memmgmt-row-actions">
                        {pendingRoleChange?.userId === member.userId ? (
                          <>
                            <span className="memmgmt-confirm-text">Change role to {roleLabel(pendingRoleChange.role)}?</span>
                            <button
                              type="button"
                              className="memmgmt-captain-btn"
                              disabled={actionLoading}
                              onClick={handleConfirmRoleChange}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="memmgmt-cancel-btn"
                              onClick={() => setPendingRoleChange(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <select
                            className="memmgmt-action-select"
                            defaultValue=""
                            disabled={actionLoading}
                            onChange={(e) => {
                              const role = e.target.value as TeamRole;
                              if (!role) return;
                              e.target.value = "";
                              setPendingRoleChange({ userId: member.userId, role });
                            }}
                          >
                            <option value="" disabled>Change role</option>
                            {roleOptionsFor(member).map((r) => (
                              <option key={r} value={r}>{roleLabel(r)}</option>
                            ))}
                          </select>
                        )}

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
            <div className="memmgmt-leave-section">
              <p className="memmgmt-readonly-note">Only the captain or vice-captain can manage members.</p>
              {confirmLeave ? (
                <div className="memmgmt-leave-confirm">
                  <span className="memmgmt-confirm-text">Are you sure you want to leave the team?</span>
                  <button type="button" className="memmgmt-remove-btn" disabled={actionLoading} onClick={handleLeaveTeam}>
                    Confirm
                  </button>
                  <button type="button" className="memmgmt-cancel-btn" onClick={() => setConfirmLeave(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" className="memmgmt-remove-btn" onClick={() => setConfirmLeave(true)}>
                  Leave Team
                </button>
              )}
            </div>
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
        onLeaveTeam={handleLeaveTeam}
        confirmingLeaveTeam={confirmLeave}
        onStartLeaveTeam={() => setConfirmLeave(true)}
        onCancelLeaveTeam={() => setConfirmLeave(false)}
        leaveTeamLoading={actionLoading}
      />
    </div>
    </>
  );
}
