import api from "../../../shared/api/Base";

// ================= OTP =================

// SEND OTP
export const sendOtp = async (phone: string) => {
  const res = await api.post("/auth/send-otp", { phone });
  return res.data;
};

// VERIFY OTP — credentials sent in POST body, never in query params
export const verifyOtp = async (phone: string, otp: string) => {
  const res = await api.post("/auth/verify-otp", { phone, otp });
  return res.data;
};

export const resendOTP = async (phone: string) => {
  const res = await api.post("/auth/resend-otp", { phone });
  return res.data;
};

// ================= REGISTER =================

export const register = async (phone: string, password: string) => {
  const res = await api.post("/auth/register", { phone, password });

  // Backend now returns { accessToken, botleagueId }
  // Refresh token is set automatically as httpOnly cookie
  const { accessToken, botleagueId } = res.data;

  // Store access token for subsequent requests
  setAccessToken(accessToken);

  return { accessToken, botleagueId };
};

// ================= LOGIN =================

export const login = async (payload: {
  identifier: string;
  password: string;
  loginType: "PHONE" | "EMAIL";
}) => {
  const res = await api.post("/auth/login", payload);

  // Backend returns { accessToken, botleagueId, expiresIn }
  // Refresh token is set automatically as httpOnly cookie
  const { accessToken, botleagueId, expiresIn } = res.data;

  setAccessToken(accessToken);

  return { accessToken, botleagueId, expiresIn: expiresIn as number | undefined };
};

// ================= REFRESH =================
// Call this when you get a 401 — it uses the httpOnly cookie automatically

export const refreshToken = async () => {
  const res = await api.post("/auth/refresh");

  const { accessToken, botleagueId, expiresIn } = res.data;
  setAccessToken(accessToken);

  return { accessToken, botleagueId, expiresIn: expiresIn as number | undefined };
};

// ================= LOGOUT =================

export const logout = async () => {
  const res = await api.post("/auth/logout");

  // Clear the access token from axios headers
  clearAccessToken();

  return res.data;
};

// ================= ME =================

export const getCurrentUser = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

// ================= FORGOT PASSWORD =================

export const forgotPassword = async (identifier: string) => {
  const res = await api.post("/auth/forgot-password", { identifier });
  return res.data;
};

// ================= RESET PASSWORD (OTP / phone flow) =================

export const resetPassword = async (payload: {
  phone: string;
  otp: string;
  newPassword: string;
}) => {
  const res = await api.post("/auth/reset-password", payload);
  return res.data;
};

// ================= RESET PASSWORD (email-token flow) =================

export const resetPasswordWithToken = async (payload: {
  token: string;
  newPassword: string;
}) => {
  const res = await api.post("/auth/reset-password", payload);
  return res.data;
};

// ================= CHANGE PHONE (OTP-verified) =================

export const changePhoneWithOtp = async (payload: {
  newPhone: string;
  otp: string;
}) => {
  const res = await api.post("/profile/change-phone", payload);
  return res.data;
};

// ================= CHANGE PASSWORD =================

export const changePassword = async (payload: {
  oldPassword: string;
  newPassword: string;
}) => {
  const res = await api.post("/auth/change-password", payload);
  return res.data;
};

// ================= TOKEN HELPERS =================

// Sets the Authorization header on every future request
function setAccessToken(token: string) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Clears it on logout
function clearAccessToken() {
  delete api.defaults.headers.common["Authorization"];
}

// Call this on app startup to restore token from memory/storage
export function initializeAuth(token: string | null) {
  if (token) {
    setAccessToken(token);
  }
}