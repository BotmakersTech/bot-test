import api from "../../../shared/api/Base";

// GET PROFILE
export const getProfile = async () => {
  const res = await api.get("/profile/me");
  return res.data;
};

export const updateUsername = async (username: string) => {
  const res = await api.post("/profile/addUserName", { username });
  return res.data;
};

export interface PublicProfileByCode {
  userId: string;
  botleagueId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profilePhotoUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  memberSince: string | null;
  accountType: string | null;
}

// Public, unauthenticated lookup of a single user by their BotLeague ID —
// used to find a specific user to grant SPORT_HEAD/EVENT_HEAD access to,
// without needing the admin-only full user-directory search.
export const getPublicProfileByCode = async (botleagueId: string): Promise<PublicProfileByCode> => {
  const res = await api.get(`/profile/public/${botleagueId}`);
  return res.data;
};
export async function updateEmail(
  email: string
) {

  const response =
    await api.post(
      "/profile/update-email",
      { email }
    );

  return response.data;
}

export const verifyEmail = async (token: string) => {
  const response = await api.get(
    `/profile/verify-email?token=${token}`
  );

  return response.data;
};

// UPDATE PROFILE
// export const updateProfile = async (payload: {
//   fullName?: string;
//   email?: string;
// }) => {
//   const res = await api.put("/user/profile", payload);
//   return res.data;
// };

export type UpdateProfilePayload = {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string; // ISO format: "YYYY-MM-DD"
  profilePhotoUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
};

export const updateProfile = async (payload: UpdateProfilePayload) => {
  const res = await api.patch("/profile/me", payload);
  return res.data;
};

export async function checkEmailVerified(): Promise<{
  verified: boolean;
  email?: string;
}> {
  const res = await api.get("/profile/me");
  const profile = res.data;

  const verified = !profile.pendingEmail;

  return {
    verified,
    email: verified ? (profile.email ?? undefined) : undefined,
  };
}