// src/feature/Team/hooks/useTeamInvitations.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useProfileComplete, parseProfileIncomplete } from "../../../shared/hooks/useProfileComplete";
import type { MissingField } from "../../../shared/components/ProfileIncompleteModal";

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

  // Full profile (name + DOB + username + photo) is required to join a team —
  // this must match TeamInviteService.acceptInvite's server-side check.
  const { isComplete, missingFields } = useProfileComplete();

  // Controls the "complete your profile" gate modal for join-team action.
  const [showProfileGate, setShowProfileGate] = useState(false);
  // Missing fields parsed from a server PROFILE_INCOMPLETE rejection, if the
  // client check somehow passed but the backend still said no.
  const [serverMissing, setServerMissing] = useState<MissingField[] | null>(null);

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
          setServerMissing(null);
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

          const serverMsg = err?.response?.data?.message as string | undefined;
          const parsed = parseProfileIncomplete(serverMsg);
          if (parsed) {
            // Route a server-side PROFILE_INCOMPLETE into the same popup as the
            // client gate instead of surfacing a raw error string on the card.
            setServerMissing(parsed);
            setShowProfileGate(true);
            return;
          }

          throw new Error(
            serverMsg || "Failed to accept invitation",
            { cause: err }
          );

        } finally {

          setActionLoadingId(null);
        }
      },
      [isComplete]
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
    missingFields: serverMissing ?? missingFields,
    closeProfileGate: () => { setShowProfileGate(false); setServerMissing(null); },
  };
}