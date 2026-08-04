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

export const register = async (phone: string, otp: string, password: string, role: string) => {
  const res = await api.post("/auth/register", { phone, otp, password, role });

  // Backend returns { accessToken, botleagueId } for an immediately-active account
  // (Participant/Volunteer), or { pendingApproval: true, botleagueId, message } with
  // no accessToken for an Organiser/Judge account awaiting admin approval — refresh
  // token cookie is only set in the former case.
  const { accessToken, botleagueId, pendingApproval, message } = res.data;

  if (accessToken) {
    setAccessToken(accessToken);
  }

  return { accessToken, botleagueId, pendingApproval: Boolean(pendingApproval), message };
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

// ================= GOOGLE SIGN-IN =================

export const googleSignIn = async (idToken: string) => {
  const res = await api.post("/auth/google", { idToken });

  // Same response shape as /login — a Google sign-in for an existing,
  // non-ACTIVE account is rejected server-side rather than returning a
  // pending-approval shape here, so this always means success.
  const { accessToken, botleagueId, expiresIn } = res.data;
  setAccessToken(accessToken);

  return { accessToken, botleagueId, expiresIn: expiresIn as number | undefined };
};

// ================= SELECT ROLE (post-Google-signin onboarding) =================

export const selectRole = async (role: string) => {
  const res = await api.post("/auth/select-role", { role });

  // Self-active role (COMPETITOR/VOLUNTEER): { accessToken, botleagueId, expiresIn }.
  // Approval-required role (ORGANISER/JUDGE): { pendingApproval: true, botleagueId,
  // message }, accessToken absent — the session was revoked server-side.
  const { accessToken, botleagueId, expiresIn, pendingApproval, message } = res.data;

  if (accessToken) {
    setAccessToken(accessToken);
  }

  return {
    accessToken,
    botleagueId,
    expiresIn: expiresIn as number | undefined,
    pendingApproval: Boolean(pendingApproval),
    message,
  };
};

// ================= VERIFY PHONE (mandatory post-Google-signin gate) =================

export const verifyPhone = async (phone: string, otp: string) => {
  const res = await api.post("/profile/verify-phone", { phone, otp });
  return res.data;
};

// Clears the in-memory access token without a network round-trip — for
// cases where the backend already tore down the session as a side effect of
// another call (select-role's pending-approval branch clears the refresh
// cookie itself), so a follow-up /auth/logout call would be redundant.
export function clearLocalSession() {
  clearAccessToken();
}

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