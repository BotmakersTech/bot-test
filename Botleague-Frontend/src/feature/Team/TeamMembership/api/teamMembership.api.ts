import api from "../../../../shared/api/Base";

// ======================================================
// TEAM ROLE
// ======================================================

export type TeamRole =
  | "CAPTAIN"
  | "VICE_CAPTAIN"
  | "MEMBER"
  | "MENTOR";

// ======================================================
// TEAM MEMBER
// ======================================================

export interface TeamMember {

  // =====================================
  // USER DATA
  // =====================================

  userId: string;

  botleagueId?: string;

  username?: string;

  firstName?: string;

  lastName?: string;

  gender?: string;

  dateOfBirth?: string;

  profilePhotoUrl?: string;

  country?: string;

  state?: string;

  city?: string;

  address?: string;

  // =====================================
  // MEMBERSHIP DATA
  // =====================================

  membershipId?: string;

  teamId?: string;

  teamMemberId?: string;

  teamRole?: TeamRole;

  membershipStatus?: string;
}

// ======================================================
// TEAM MEMBERSHIP RESPONSE
// ======================================================

export interface TeamMembershipResponse {

  teamCode: string;

  teamName: string;

  logo_Url?: string | null;

  members: TeamMember[];
}

// ======================================================
// GET TEAM MEMBERS
// ======================================================

export const getTeamMemberships =
  async (
    teamCode: string
  ): Promise<TeamMembershipResponse[]> => {

    const response =
      await api.get(

        `/teams/${teamCode}/members`,

        {
          withCredentials: true,
        }
      );

    const data =
      response.data;

    return Array.isArray(data)
      ? data
      : [data];
  };

// ======================================================
// INVITE MEMBER
// backend now expects:
// teamCode + invitedBotLeagueUserId
// ======================================================

export const inviteMember =
  async (
    teamCode: string,
    invitedBotleagueId: string,
    role?: TeamRole
  ) => {

    const response =
      await api.post(

        `/team-invites/teams/${teamCode}/invite`,

        {
          invitedUserId:
            invitedBotleagueId,
          role,
        },

        {
          withCredentials: true,
        }
      );

    return response.data;
  };

// ======================================================
// ASSIGN ROLE
// ======================================================

export const assignRole =
  async (
    userId: string,
    role: TeamRole
  ) => {

    const response =
      await api.patch(

        `/membership/${userId}/role`,

        null,

        {
          params: {
            role,
          },

          withCredentials: true,
        }
      );

    return response.data;
  };

// ======================================================
// TRANSFER CAPTAIN
// ======================================================

export const transferCaptain =
  async (
    userId: string
  ) => {

    const response =
      await api.patch(

        `/membership/${userId}/transfer-captain`,

        null,

        {
          withCredentials: true,
        }
      );

    return response.data;
  };

// ======================================================
// LEAVE TEAM
// ======================================================

export const leaveTeam =
  async () => {

    const response =
      await api.post(

        `/membership/leave`,

        {},

        {
          withCredentials: true,
        }
      );

    return response.data;
  };

// ======================================================
// REMOVE MEMBER
// ======================================================

export const removeMember =
  async (
    userId: string
  ) => {

    const response =
      await api.post(

        `/membership/${userId}/remove`,

        {},

        {
          withCredentials: true,
        }
      );

    return response.data;
  };