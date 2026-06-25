// src/feature/Team/hooks/useTeam.ts

import { useEffect, useState } from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "../../../app/hooks";


import {
  setMemberships,
  clearMemberships,
} from "../../Team/TeamMembership/store/TeamMembership.slice";
import {
  createTeam,
  getMyTeam,
  updateTeam,
  leaveTeam,

  type CreateTeamPayload,
  type TeamResponse,
} from "../api/team.api";

import {
  getTeamMemberships,
  type TeamMembershipsApiResponse,
} from "../../UserDashboard/api/userMembership.api";

import {
  setTeam as setReduxTeam,
  clearTeam,
} from "../store/TeamSlice";


// ======================================================
// HOOK
// ======================================================

export default function useTeam() {

  const dispatch = useAppDispatch();


  // ======================================================
  // REDUX
  // ======================================================

  const teamCode = useAppSelector(
    (state) => state.team.teamCode
  );


  // ======================================================
  // STATE
  // ======================================================

  const [team, setTeam] =
    useState<TeamResponse | null>(null);


  // ✅ FIXED
  const [teamMemberships, setTeamMemberships] =
    useState<TeamMembershipsApiResponse[]>([]);


  const [teamName, setTeamName] =
    useState("");


  const [description, setDescription] =
    useState("");


  const [institutionName, setInstitutionName] =
    useState("");


  const [city, setCity] =
    useState("");


  const [state, setState] =
    useState("");


  const [country, setCountry] =
    useState("");


  const [status, setStatus] =
    useState("");


  const [isLoading, setIsLoading] =
    useState(false);


  const [error, setError] =
    useState<string | null>(null);


  // ======================================================
  // LOAD TEAM
  // ======================================================

  const loadTeam = async () => {

    try {

      setIsLoading(true);

      setError(null);

      const data =
        await getMyTeam();

      // ======================================================
      // LOCAL STATE
      // ======================================================

      setTeam(data);

      setTeamName(
        data.teamName || ""
      );

      setDescription(
        data.description || ""
      );

      setInstitutionName(
        data.institutionName || ""
      );

      setCity(
        data.city || ""
      );

      setState(
        data.state || ""
      );

      setCountry(
        data.country || ""
      );

      setStatus(
        data.status || ""
      );


      // ======================================================
      // SAVE TO REDUX
      // ======================================================

      dispatch(
        setReduxTeam({

          id:
            data.id || null,

          teamCode:
            data.teamCode || null,

          teamName:
            data.teamName || null,

          description:
            data.description || null,

          logoUrl:
            data.logoUrl || null,

          institutionName:
            data.institutionName || null,

          city:
            data.city || null,

          state:
            data.state || null,

          country:
            data.country || null,
        })
      );

    } catch (err: any) {

      console.error(err);

      if (
        err?.response?.status !== 404
      ) {

        setError(
          "Failed to load team"
        );

      } else {

        dispatch(clearTeam());
      }

    } finally {

      setIsLoading(false);
    }
  };


  // ======================================================
  // LOAD TEAM MEMBERSHIPS
  // ======================================================

  const loadTeamMemberships =
    async () => {

      try {

        if (!teamCode) {

          setTeamMemberships([]);

dispatch(clearMemberships());

          return;
        }

        setIsLoading(true);

        setError(null);

          const data = await getTeamMemberships(teamCode);

        setTeamMemberships(data);

const normalised =
  data.flatMap((team) =>
    (team.members ?? []).map(
      (member) => ({

        id:
          member.membershipId ??
          member.teamMemberId ??
          member.userId ??
          "",

        userId:
          member.userId ??
          "",

        joinedAt:
          member.joinedAt ??
          "",

        role:
          member.role ??
          member.teamRole ??
          "",

        status:
          member.status ??
          "ACTIVE",

        userName:
          member.username
          || [member.firstName, member.lastName].filter(Boolean).join(" ").trim()
          || member.botleagueId
          || "",

        userCode:
          member.userCode ??
          "",

        teamRole:
          member.teamRole ??
          member.role ??
          "",

        teamId:
          team.teamCode ??
          "",

        isActive:
          member.isActive ??
          true,

        teamMemberId:
          member.membershipId ??
          member.teamMemberId ??
          member.userId ??
          "",
      })
    )
  );

dispatch(
  setMemberships(normalised)
);

      } catch (err: any) {

        console.error(err);

        setError(
          err?.response?.data?.message ||
          "Failed to load memberships"
        );

      } finally {

        setIsLoading(false);
      }
    };


  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTeam();

  }, []);


  // ======================================================
  // LOAD MEMBERSHIPS WHEN TEAM CODE CHANGES
  // ======================================================

  useEffect(() => {

    if (teamCode) {

      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTeamMemberships();
    }

  }, [teamCode]);


  // ======================================================
  // CREATE TEAM
  // ======================================================

  const handleCreateTeam =
    async () => {

      try {

        setIsLoading(true);

        setError(null);

        const payload:
          CreateTeamPayload = {

            teamName,

            description:
              description || undefined,

            institutionName:
              institutionName || undefined,

            city:
              city || undefined,

            state:
              state || undefined,

            country:
              country || undefined,
          };

        await createTeam(payload);

        await loadTeam();

        await loadTeamMemberships();

      } catch (err: any) {

        console.error(err);

        setError(
          err?.response?.data?.message ||
          "Failed to create team"
        );

      } finally {

        setIsLoading(false);
      }
    };


  // ======================================================
  // UPDATE TEAM
  // ======================================================

  const handleUpdateTeam =
    async (
      payload?: {
        teamName?: string;
        description?: string;
        institutionName?: string;
        city?: string;
        state?: string;
        country?: string;
      }
    ) => {

      try {

        setIsLoading(true);

        setError(null);

        await updateTeam({

          teamName:
            payload?.teamName ??
            teamName,

          description:
            payload?.description ??
            description,

          institutionName:
            payload?.institutionName ??
            institutionName,

          city:
            payload?.city ??
            city,

          state:
            payload?.state ??
            state,

          country:
            payload?.country ??
            country,
        });

        await loadTeam();

        return true;

      } catch (err: any) {

        console.error(err);

        const message =
          err?.response?.data?.message ||
          "Failed to update team";

        setError(message);

        throw new Error(message, { cause: err });

      } finally {

        setIsLoading(false);
      }
    };


  // ======================================================
  // LEAVE TEAM
  // ======================================================

  const handleLeaveTeam =
    async () => {

      try {

        setIsLoading(true);

        setError(null);

        await leaveTeam();


        // ======================================================
        // CLEAR LOCAL STATE
        // ======================================================

        setTeam(null);

        setTeamMemberships([]);

        setTeamName("");

        setDescription("");

        setInstitutionName("");

        setCity("");

        setState("");

        setCountry("");

        setStatus("");


        // ======================================================
        // CLEAR REDUX
        // ======================================================

        dispatch(
          clearTeam()
        );

      } catch (err: any) {

        console.error(err);

        setError(
          err?.response?.data?.message ||
          "Failed to leave team"
        );

      } finally {

        setIsLoading(false);
      }
    };


  // ======================================================
  // RETURN
  // ======================================================

  return {

    // ======================================================
    // TEAM
    // ======================================================

    team,


    // ======================================================
    // MEMBERSHIPS
    // ======================================================

    teamMemberships,


    // ======================================================
    // FORM FIELDS
    // ======================================================

    teamName,
    setTeamName,

    description,
    setDescription,

    institutionName,
    setInstitutionName,

    city,
    setCity,

    state,
    setState,

    country,
    setCountry,

    status,


    // ======================================================
    // ACTIONS
    // ======================================================

    loadTeam,

    loadTeamMemberships,

    handleCreateTeam,

    handleUpdateTeam,

    handleLeaveTeam,


    // ======================================================
    // UI STATE
    // ======================================================

    isLoading,

    error,
  };
}