import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAppSelector } from "../../../../app/hooks";

import {
  getTeamMemberships,
  inviteMember,
  removeMember,
  assignRole,
  transferCaptain,
  leaveTeam,
  type TeamMembershipResponse,
  type TeamMember,
  type TeamRole,
} from "../api/teamMembership.api";

// ======================================================
// HOOK
// ======================================================

const useTeamMembership = (
  teamCode: string
) => {

  // ======================================================
  // GLOBAL STATE
  // ======================================================

  const authUser =
    useAppSelector(
      (state) => state.auth.user
    );

  // ======================================================
  // STATE
  // ======================================================

  const [
    teamMemberships,
    setTeamMemberships,
  ] =
    useState<
      TeamMembershipResponse[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    inviteLoading,
    setInviteLoading,
  ] =
    useState(false);

  const [
    removingMemberId,
    setRemovingMemberId,
  ] =
    useState<
      string | null
    >(null);

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  // ======================================================
  // LOAD
  // ======================================================

  const loadTeamMemberships =
    useCallback(
      async () => {

        if (!teamCode)
          return;

        try {

          setLoading(
            true
          );

          setError(
            null
          );

          const response =
            await getTeamMemberships(
              teamCode
            );

          setTeamMemberships(
            response
          );

        } catch (
          err: any
        ) {

          setError(
            err?.response
              ?.data
              ?.message ||
            "Failed to load team memberships"
          );

        } finally {

          setLoading(
            false
          );
        }
      },
      [teamCode]
    );

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTeamMemberships();

  }, [
    loadTeamMemberships,
  ]);

  // ======================================================
  // DERIVED
  // ======================================================

  const teamData =
    useMemo(
      () =>
        teamMemberships?.[0] ||
        null,
      [
        teamMemberships,
      ]
    );

  const members =
    useMemo<
      TeamMember[]
    >(
      () =>
        teamData?.members ||
        [],
      [teamData]
    );

  const captain =
    useMemo(
      () =>
        members.find(
          (
            member
          ) =>
            member.teamRole ===
            "CAPTAIN"
        ) ||
        null,
      [members]
    );

  const viceCaptain =
    useMemo(
      () =>
        members.find(
          (
            member
          ) =>
            member.teamRole ===
            "VICE_CAPTAIN"
        ) ||
        null,
      [members]
    );

  const currentUserMembership =
    useMemo(
      () =>
        members.find(
          (
            member
          ) =>
            member.userId ===
            authUser?.id
        ) ||
        null,
      [
        members,
        authUser,
      ]
    );

  const isCaptain =
    currentUserMembership
      ?.teamRole ===
    "CAPTAIN";

  const isViceCaptain =
    currentUserMembership
      ?.teamRole ===
    "VICE_CAPTAIN";

  const isAdmin =
    isCaptain ||
    isViceCaptain;

  // ======================================================
  // INVITE
  // ======================================================

  const handleInviteMember =
    useCallback(
      async (
        botleagueId:
          string,
        role?:
          TeamRole
      ) => {

        try {

          setInviteLoading(
            true
          );

          setError(
            null
          );

          await inviteMember(
            teamCode,
            botleagueId,
            role
          );

          await loadTeamMemberships();

          return true;

        } catch (
          err: any
        ) {

          const message =
            err?.response
              ?.data
              ?.message ||
            "Failed to invite member";

          setError(
            message
          );

          throw new Error(
            message, { cause: err }
          );

        } finally {

          setInviteLoading(
            false
          );
        }
      },
      [
        teamCode,
        loadTeamMemberships,
      ]
    );

  // ======================================================
  // REMOVE
  // ======================================================

  const handleRemoveMember =
    useCallback(
      async (
        userId:
          string
      ) => {

        try {

          setRemovingMemberId(
            userId
          );

          setError(
            null
          );

          await removeMember(
            userId
          );

          await loadTeamMemberships();

          return true;

        } catch (
          err: any
        ) {

          const message =
            err?.response
              ?.data
              ?.message ||
            "Failed to remove member";

          setError(
            message
          );

          throw new Error(
            message, { cause: err }
          );

        } finally {

          setRemovingMemberId(
            null
          );
        }
      },
      [
        loadTeamMemberships,
      ]
    );

  // ======================================================
  // ASSIGN ROLE
  // ======================================================

  const handleAssignRole =
    useCallback(
      async (
        userId:
          string,
        role:
          TeamRole
      ) => {

        try {

          setActionLoading(
            true
          );

          setError(
            null
          );

          await assignRole(
            userId,
            role
          );

          await loadTeamMemberships();

          return true;

        } catch (
          err: any
        ) {

          const message =
            err?.response
              ?.data
              ?.message ||
            "Failed to assign role";

          setError(
            message
          );

          throw new Error(
            message, { cause: err }
          );

        } finally {

          setActionLoading(
            false
          );
        }
      },
      [
        loadTeamMemberships,
      ]
    );

  // ======================================================
  // TRANSFER CAPTAIN
  // ======================================================

  const handleTransferCaptain =
    useCallback(
      async (
        userId:
          string
      ) => {

        try {

          setActionLoading(
            true
          );

          setError(
            null
          );

          await transferCaptain(
            userId
          );

          await loadTeamMemberships();

          return true;

        } catch (
          err: any
        ) {

          const message =
            err?.response
              ?.data
              ?.message ||
            "Failed to transfer captain";

          setError(
            message
          );

          throw new Error(
            message, { cause: err }
          );

        } finally {

          setActionLoading(
            false
          );
        }
      },
      [
        loadTeamMemberships,
      ]
    );

  // ======================================================
  // LEAVE TEAM
  // ======================================================

  const handleLeaveTeam =
    useCallback(
      async () => {

        try {

          setActionLoading(
            true
          );

          setError(
            null
          );

          await leaveTeam();

          await loadTeamMemberships();

          return true;

        } catch (
          err: any
        ) {

          const message =
            err?.response
              ?.data
              ?.message ||
            "Failed to leave team";

          setError(
            message
          );

          throw new Error(
            message, { cause: err }
          );

        } finally {

          setActionLoading(
            false
          );
        }
      },
      [
        loadTeamMemberships,
      ]
    );

  // ======================================================
  // RETURN
  // ======================================================

  return {

    // auth
    authUser,

    // raw
    teamMemberships,
    teamData,

    // members
    members,
    captain,
    viceCaptain,
    currentUserMembership,

    // roles
    isCaptain,
    isViceCaptain,
    isAdmin,

    // loading
    loading,
    inviteLoading,
    removingMemberId,
    actionLoading,

    // error
    error,

    // reload
    reload:
      loadTeamMemberships,

    // actions
    inviteMember:
      handleInviteMember,

    removeMember:
      handleRemoveMember,

    assignRole:
      handleAssignRole,

    transferCaptain:
      handleTransferCaptain,

    leaveTeam:
      handleLeaveTeam,
  };
};

export default
  useTeamMembership;