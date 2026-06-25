/* eslint-disable @typescript-eslint/no-explicit-any */
// ======================================================
// useEvent.ts
// ======================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {  useAppSelector } from "../../../app/hooks";
 import useTeam from "../../Team/hooks/useTeam";
import {
  addLineupMember,
  cancelEventRegistration,
  getEventSportRegistrations,
  getEventSports,
  getLineup,
  getLiveEvents,
  getTeamRegistrations,
  registerTeamToEvent,
  removeLineupMember,

  type AddLineupMemberRequest,
  type EventRegistrationResponse,
  type EventResponse,
  type EventSportResponse,
  type RegisterTeamRequest,
  type TeamLineUpResponse,
} from "../api/event.api";

// ======================================================
// TYPES
// ======================================================

export interface TeamMember {
  userName: string;
  userId: string;
  userCode: string;
  teamRole: string;
  teamMemberId: string;
  membershipId: string;
}


export interface UseEventReturn {
  // State
  events: EventResponse[];
  eventSports: EventSportResponse[];
  registrations: EventRegistrationResponse[];
  lineup: TeamLineUpResponse[];

  loading: boolean;
  error: string | null;

  // Team
  teamId: string;
  teamCode: string;
  teamMembers: TeamMember[];

  // Role
  myRole: string;
  isCaptain: boolean;

  // Events
  fetchLiveEvents: () => Promise<void>;
  fetchEventSports: (eventId: string) => Promise<void>;

  // Registrations
  registerTeam: (
    req: RegisterTeamRequest
  ) => Promise<EventRegistrationResponse | null>;

  fetchTeamRegistrations: (teamId: string) => Promise<void>;

  fetchEventSportRegistrations: (
    eventSportId: string
  ) => Promise<void>;

  cancelRegistration: (
    registrationId: string
  ) => Promise<boolean>;

  // Lineup
  addMemberToLineup: (
    req: AddLineupMemberRequest
  ) => Promise<TeamLineUpResponse | null>;

  fetchLineup: (
    eventRegistrationId: string
  ) => Promise<void>;

  removeMemberFromLineup: (
    lineupId: string
  ) => Promise<boolean>;

  clearError: () => void;
}

// ======================================================
// HELPERS
// ======================================================

const isCaptainRole = (
  role?: string
): boolean => {

  return role
    ?.toLowerCase()
    .includes("captain") ?? false;
};

// ======================================================
// HOOK
// ======================================================

export const useEvent = (): UseEventReturn => {
  // ======================================================
  // REDUX
  // ======================================================
const {
  loadTeam,
  loadTeamMemberships,
} = useTeam();

useEffect(() => {

  const initialise = async () => {

    await loadTeam();

    await loadTeamMemberships();
  };

  initialise();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const teamState = useAppSelector(
  (state) => state.team
);

const memberships = useAppSelector(
  (state) => state.teamMembership.memberships
);

  const currentUserId = useAppSelector(
    (state) =>
      (state as any).profile?.id ??
      (state as any).auth?.user?.id ??
      ""
  );

  // ======================================================
  // TEAM MEMBERS
  // ======================================================

  const teamMembers = useMemo((): TeamMember[] => {
    if (!memberships || memberships.length === 0) {
      return [];
    }

    const allMembers: TeamMember[] = [];

    memberships.forEach((membership: any) => {
      // CASE 1: Nested members array
      if (Array.isArray(membership?.members)) {
        membership.members.forEach((m: any) => {
          allMembers.push({
            userName:
              m.userName ||
              m.username ||
              [m.firstName, m.lastName].filter(Boolean).join(" ").trim() ||
              m.botleagueId ||
              "",
            userId: m.userId ?? m.id ?? "",
            userCode: m.userCode ?? m.botleagueId ?? "",
            teamRole: m.teamRole ?? m.roleInTeam ?? m.role ?? "",
            // membershipId = TeamMembership.id (the UUID needed for lineup)
            // try every alias the backend may use before falling back to userId
            teamMemberId:
              m.membershipId ?? m.teamMemberId ?? m.id ?? m.userId ?? "",
            membershipId:
              m.membershipId ?? m.teamMemberId ?? m.id ?? m.userId ?? "",
          });
        });
      }

      // CASE 2: Flat member object
      else {
        allMembers.push({
          userName:
            membership.userName ||
            membership.username ||
            [membership.firstName, membership.lastName].filter(Boolean).join(" ").trim() ||
            membership.botleagueId ||
            "",

          userId:
            membership.userId ??
            membership.id ??
            "",

          userCode:
            membership.userCode ??
            "",

          teamRole:
            membership.teamRole ??
            membership.role ??
            "",

          teamMemberId: membership.id ?? membership.teamMemberId ?? membership.userId ?? "",
          membershipId: membership.id ?? membership.membershipId ?? membership.teamMemberId ?? membership.userId ?? "",
        });
      }
    });

    return allMembers;
  }, [memberships]);

  // ======================================================
  // MY ROLE
  // ======================================================

  const myRole = useMemo(() => {
    if (!currentUserId) return "";

    const me = teamMembers.find(
      (m) => m.userId === currentUserId
    );
    return me?.teamRole ?? "";
  }, [teamMembers, currentUserId]);

  // ======================================================
  // CAPTAIN CHECK
  // ======================================================

  const isCaptain = useMemo(() => {
    return isCaptainRole(myRole);
  }, [myRole]);

  // ======================================================
  // TEAM IDS
  // ======================================================

  const teamId =
    teamState?.id ??
    (teamState as any)?.teamId ??
    "";

  const teamCode =
    teamState?.teamCode ??
    "";

  // ======================================================
  // LOCAL STATE
  // ======================================================

  const [events, setEvents] = useState<EventResponse[]>([]);
  const [eventSports, setEventSports] = useState<
    EventSportResponse[]
  >([]);

  const [registrations, setRegistrations] = useState<
    EventRegistrationResponse[]
  >([]);

  const [lineup, setLineup] = useState<
    TeamLineUpResponse[]
  >([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Monotonically-incrementing counter for fetchTeamRegistrations.
  // Each call snapshots the current value; the response is discarded if a
  // newer call has already started — prevents a stale response from
  // overwriting a more recent one (e.g. cancel → re-fetch race).
  const fetchRegVersionRef = useRef(0);

  // ======================================================
  // FETCH LIVE EVENTS
  // ======================================================

  const fetchLiveEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getLiveEvents();

      setEvents(response);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
          err?.message ??
          "Failed to fetch events."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================================================
  // FETCH EVENT SPORTS
  // ======================================================

  const fetchEventSports = useCallback(
    async (eventId: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getEventSports(
          eventId
        );

        setEventSports(response);
      } catch (err: any) {
        setError(
          err?.response?.data?.error ??
            err?.message ??
            "Failed to fetch sports."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ======================================================
  // REGISTER TEAM
  // ======================================================

  const registerTeam = useCallback(
    async (
      request: RegisterTeamRequest
    ): Promise<EventRegistrationResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        return await registerTeamToEvent(
          request
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.error ??
            err?.message ??
            "Failed to register team."
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ======================================================
  // FETCH TEAM REGISTRATIONS
  // ======================================================

  const fetchTeamRegistrations =
    useCallback(async (teamId: string) => {
      const version = ++fetchRegVersionRef.current;
      try {
        setLoading(true);
        setError(null);

        const response =
          await getTeamRegistrations(teamId);

        // Discard if a newer call has already started (cancel → re-fetch race)
        if (version !== fetchRegVersionRef.current) return;

        setRegistrations(response);
      } catch (err: any) {
        if (version !== fetchRegVersionRef.current) return;
        setError(
          err?.response?.data?.error ??
            err?.message ??
            "Failed to fetch registrations."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // ======================================================
  // FETCH EVENT SPORT REGISTRATIONS
  // ======================================================

  const fetchEventSportRegistrations =
    useCallback(async (eventSportId: string) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await getEventSportRegistrations(
            eventSportId
          );

        setRegistrations(response);
      } catch (err: any) {
        setError(
          err?.response?.data?.error ??
            err?.message ??
            "Failed to fetch registrations."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // ======================================================
  // CANCEL REGISTRATION
  // ======================================================

  const cancelRegistration = useCallback(
    async (
      registrationId: string
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await cancelEventRegistration(
          registrationId
        );

        setRegistrations((prev) =>
          prev.filter(
            (item) =>
              (item.registrationId ?? item.id) !== registrationId
          )
        );

        return true;
      } catch (err: any) {
        setError(
          err?.response?.data?.error ??
            err?.message ??
            "Failed to cancel registration."
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ======================================================
  // ADD MEMBER TO LINEUP
  // ======================================================

  const addMemberToLineup = useCallback(
    async (
      request: AddLineupMemberRequest
    ): Promise<TeamLineUpResponse | null> => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await addLineupMember(request);

        setLineup((prev) => [
          ...prev,
          response,
        ]);

        return response;
      } catch (err: any) {
        setError(
          err?.response?.data?.error ??
            err?.message ??
            "Failed to add member."
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ======================================================
  // FETCH LINEUP
  // ======================================================

  const fetchLineup = useCallback(
    async (eventRegistrationId: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getLineup(
          eventRegistrationId
        );

        setLineup(response);
      } catch (err: any) {
        setError(
          err?.response?.data?.error ??
            err?.message ??
            "Failed to fetch lineup."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ======================================================
  // REMOVE MEMBER FROM LINEUP
  // ======================================================

  const removeMemberFromLineup =
    useCallback(
      async (
        lineupId: string
      ): Promise<boolean> => {
        try {
          setLoading(true);
          setError(null);

          await removeLineupMember(lineupId);

          setLineup((prev) =>
            prev.filter(
              (item) =>
                item.lineupId !== lineupId
            )
          );

          return true;
        } catch (err: any) {
          setError(
            err?.response?.data?.error ??
              err?.message ??
              "Failed to remove member."
          );

          return false;
        } finally {
          setLoading(false);
        }
      },
      []
    );

  // ======================================================
  // RETURN
  // ======================================================

  return {
    // State
    events,
    eventSports,
    registrations,
    lineup,

    loading,
    error,

    // Team
    teamId,
    teamCode,
    teamMembers,

    // Role
    myRole,
    isCaptain,

    // Events
    fetchLiveEvents,
    fetchEventSports,

    // Registrations
    registerTeam,
    fetchTeamRegistrations,
    fetchEventSportRegistrations,
    cancelRegistration,

    // Lineup
    addMemberToLineup,
    fetchLineup,
    removeMemberFromLineup,

    // Helpers
    clearError,
  };
};