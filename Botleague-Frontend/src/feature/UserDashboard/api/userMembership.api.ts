import api from "../../../shared/api/Base";

// ======================================================
// TEAM MEMBER TYPES
// ======================================================

export interface TeamMember {
  userId: string;
  userName?: string;       // normalised display name (set by frontend)
  username?: string;       // backend field (lowercase)
  firstName?: string;      // backend field
  lastName?: string;       // backend field
  botleagueId?: string;    // backend field
  userCode?: string;
  teamRole?: string;
  role?: string;
  status?: string;
  joinedAt?: string;
  isActive?: boolean;
  membershipId?: string;
  teamMemberId?: string;
}

// ======================================================
// TEAM MEMBERSHIP RESPONSE
// — one entry in the members array after normalisation
// ======================================================

export interface TeamMembershipResponse {
  id?: string;
  userId?: string;
  joinedAt?: string;
  role?: string;
  status?: string;
  userName?: string;
  userCode?: string;
  teamRole?: string;
  teamId?: string;
  isActive?: boolean;
  teamMemberId?: string;
}

// ======================================================
// TEAM DETAILS RESPONSE
// — what the API actually returns per team
// ======================================================

export interface TeamMembershipsApiResponse {
  teamMemberId: any;
  teamCode: string;
  teamName: string;
  members: TeamMember[];
}

// ======================================================
// TEAM INVITATION TYPES
// ======================================================

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

export interface TeamInvitationResponse {
  inviteId: string;
  teamId: string;
  teamName: string;
  teamCode?: string;
  invitedUserId: string;
  invitedBy?: string;
  inviterName?: string;
  status: InvitationStatus;
  createdAt?: string;
  expiresAt?: string;
  wasRejoin?: boolean;
}

// ======================================================
// GET TEAM MEMBERS
// — returns TeamMembershipsApiResponse[] (array of team
//   objects each containing a members array)
// ======================================================

export const getTeamMemberships = async (
  teamCode: string
): Promise<TeamMembershipsApiResponse[]> => {
  const response = await api.get(`/teams/${teamCode}/members`, {
    withCredentials: true,
  });

  const data = response.data;
  return Array.isArray(data) ? data : [data];
};

// ======================================================
// INVITE MEMBER
// ======================================================

export const inviteMember = async (
  teamCode: string,
  invitedUserId: string
) => {
  const response = await api.post(
    `/team-invites/teams/${teamCode}/invite`,
    { invitedUserId },
    { withCredentials: true }
  );
  return response.data;
};

// ======================================================
// GET MY INVITATIONS
// ======================================================

export const myInvitations = async (): Promise<TeamInvitationResponse[]> => {
  const response = await api.get(`/team-invites/my`, {
    withCredentials: true,
  });
  return response.data;
};

// ======================================================
// ACCEPT INVITATION
// ======================================================

export const acceptInvitation = async (inviteId: string) => {
  const response = await api.post(
    `/team-invites/${inviteId}/accept`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

// ======================================================
// DECLINE INVITATION
// ======================================================

export const declineInvitation = async (inviteId: string) => {
  const response = await api.post(
    `/team-invites/${inviteId}/reject`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

// ======================================================
// LEAVE TEAM
// ======================================================

export const leftTeam = async () => {
  const response = await api.post(`/teams/leaveTeam`);
  return response.data;
};