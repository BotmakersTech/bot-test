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