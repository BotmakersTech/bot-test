// src/feature/Team/hooks/useTeamInvitations.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMinimalProfileComplete } from "../../../shared/hooks/useProfileComplete";

import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import {
  myInvitations,
  acceptInvitation,
  declineInvitation,
  leftTeam,
  type TeamInvitationResponse,
} from "../../UserDashboard/api/userMembership.api";

import { clearTeam } from "../store/TeamSlice";

// ======================================================
// HOOK
// ======================================================

export default function useTeamInvitations() {

  // ======================================================
  // HOOKS
  // ======================================================

  const navigate = useNavigate();

  const dispatch = useDispatch();

  // Only username + DOB are strictly required to join a team.
  const { isComplete, missingFields } = useMinimalProfileComplete();

  // Controls the "complete your profile" gate modal for join-team action
  const [showProfileGate, setShowProfileGate] = useState(false);

  // ======================================================
  // STATE
  // ======================================================

  const [invitations, setInvitations] =
    useState<TeamInvitationResponse[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [actionLoadingId, setActionLoadingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [isLeaving, setIsLeaving] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  // ======================================================
  // LOAD INVITATIONS
  // ======================================================

  const loadInvitations =
    useCallback(async () => {

      try {

        setIsLoading(true);

        setError(null);

        const data =
          await myInvitations();

        console.log(
          "Fetched Invitations:",
          data
        );

        setInvitations(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err: any) {

        console.error(
          "Load Invitations Error:",
          err
        );

        setError(
          err?.response?.data?.message ||
          "Failed to load invitations"
        );

      } finally {

        setIsLoading(false);
      }
    }, []);

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvitations();

  }, [loadInvitations]);

  // ======================================================
  // ACCEPT INVITATION
  // ======================================================

  const handleAcceptInvitation =
    useCallback(
      async (inviteId: string) => {

        // ── Profile completeness gate ─────────────────────────
        if (!isComplete) {
          setShowProfileGate(true);
          return;
        }

        try {

          setActionLoadingId(inviteId);

          await acceptInvitation(inviteId);

          // optimistic update
          setInvitations((prev) =>
            prev.map((invite) =>
              invite.inviteId === inviteId
                ? {
                    ...invite,
                    status: "ACCEPTED",
                  }
                : invite
            )
          );

        } catch (err: any) {

          console.error(
            "Accept Invitation Error:",
            err
          );

          throw new Error(
            err?.response?.data?.message ||
            "Failed to accept invitation",
            { cause: err }
          );

        } finally {

          setActionLoadingId(null);
        }
      },
      []
    );

  // ======================================================
  // HANDLE LEAVE TEAM
  // ======================================================

  const handleLeaveTeam =
    useCallback(async () => {

      try {

        setIsLeaving(true);

        setError(null);

        setSuccessMessage(null);

        // =========================================
        // API CALL
        // =========================================

        const response =
          await leftTeam();

        console.log(
          "Leave Team Response:",
          response
        );

        // =========================================
        // CLEAR REDUX TEAM STATE
        // =========================================

        dispatch(clearTeam());

        // =========================================
        // SUCCESS MESSAGE
        // =========================================

        setSuccessMessage(
          response?.message ||
          "Successfully left team"
        );

        // =========================================
        // OPTIONAL REDIRECT
        // =========================================

        setTimeout(() => {

          navigate("/dashboard");

        }, 1200);

        return response;

      } catch (err: any) {

        console.error(
          "Leave team failed:",
          err
        );

        const message =
          err?.response?.data?.message ||
          "Failed to leave team";

        setError(message);

        throw new Error(
          message,
          { cause: err }
        );

      } finally {

        setIsLeaving(false);
      }

    }, [dispatch, navigate]);

  // ======================================================
  // DECLINE INVITATION
  // ======================================================

  const handleDeclineInvitation =
    useCallback(
      async (inviteId: string) => {

        try {

          setActionLoadingId(inviteId);

          await declineInvitation(inviteId);

          // optimistic update
          setInvitations((prev) =>
            prev.map((invite) =>
              invite.inviteId === inviteId
                ? {
                    ...invite,
                    status: "REJECTED",
                  }
                : invite
            )
          );

        } catch (err: any) {

          console.error(
            "Decline Invitation Error:",
            err
          );

          throw new Error(
            err?.response?.data?.message ||
            "Failed to reject invitation",
            { cause: err }
          );

        } finally {

          setActionLoadingId(null);
        }
      },
      []
    );

  // ======================================================
  // DERIVED
  // ======================================================

  const pendingInvitations =
    useMemo(
      () =>
        invitations.filter(
          (invite) =>
            invite.status === "PENDING"
        ),
      [invitations]
    );

  // ======================================================
  // RETURN
  // ======================================================

  return {

    // raw
    invitations,

    // filtered
    pendingInvitations,

    // loading
    isLoading,
    actionLoadingId,
    isLeaving,

    // messages
    error,
    successMessage,

    // actions
    refetch:
      loadInvitations,

    acceptInvitation:
      handleAcceptInvitation,

    declineInvitation:
      handleDeclineInvitation,

    leaveTeam:
      handleLeaveTeam,

    // profile gate
    showProfileGate,
    missingFields,
    closeProfileGate: () => setShowProfileGate(false),
  };
}