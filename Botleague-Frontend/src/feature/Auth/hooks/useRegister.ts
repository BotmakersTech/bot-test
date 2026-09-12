import { useState, useEffect } from "react";
import { sendOtp, resendOTP, register, getCurrentUser } from "../api/auth.api";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../Profile/api/profile.api";
import { loginSuccess } from "../store/authSlice";
import { useAppDispatch } from "../../../app/hooks";
const OTP_LENGTH = 4;

// UI role-selector keys -> backend AccountType enum names. The backend never
// sees "participant" etc. — this is the one place that knows both vocabularies.
export const ROLE_MAP: Record<string, string> = {
  participant: "COMPETITOR",
  volunteer: "VOLUNTEER",
  organiser: "ORGANISER",
  judge: "JUDGE",
};

// Matches AuthService.REQUIRES_APPROVAL_ROLES — used only to show the
// "requires admin approval" note on the role cards before submitting.
export const APPROVAL_REQUIRED_ROLES = new Set(["organiser", "judge"]);

/**
 * IMPORTANT: MSG91's OTP codes are single-use — once otpService.verifyOtp()
 * succeeds for a code, that exact code is consumed and a second verify call
 * with the same code fails ("already verified"). AuthService.register()
 * already re-verifies the code server-side before creating the account, so
 * the "Verify" button here is deliberately a client-side format check only
 * (4 digits present), not a real API call — calling verifyOtp() here too
 * would consume the code before Register's own verify ever runs, and every
 * registration would fail with "already verified". Same fix as
 * useForgotPassword's mobile-OTP flow.
 */
export default function useRegister() {

   const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreed, setAgreed] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState("participant");
  // Set only when registration succeeded but the account needs admin approval
  // (Organiser/Judge) — no session was established, so the page should show
  // this instead of navigating into the app.
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // ⏱ OTP resend timer
  useEffect(() => {
    if (otpVerified) return; // 🔧 stop the countdown once OTP is verified
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((v) => v - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer, otpVerified]);

  // 📲 SEND OTP
  const handleSendOtp = async () => {
    setError(null);

    if (mobile.length !== 10) {
      setError("Enter valid 10-digit mobile number");
      return;
    }

    try {
      setIsLoading(true);
      await sendOtp(mobile);

      setOtpSent(true);
      setResendTimer(30);
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpVerified(false);

    } catch {
      setError("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

 // Client-side format check only — see hook-level comment above.
 const handleVerifyOtp = () => {
  setError(null);

  const fullOtp = otp.join("");

  if (fullOtp.length < 4) {
    setError("Enter complete OTP");
    return;
  }

  setOtpVerified(true);
  setResendTimer(0); // 🔧 stop countdown immediately on verify
};

const handleResendOtp = async () => {
  setError(null);

  if (mobile.length !== 10) {
    setError("Enter valid mobile number");
    return;
  }

  if (resendTimer > 0) {
    return; // ⛔ prevent spam click
  }

  try {
    setIsLoading(true);
    
    await  resendOTP( mobile);
console.log("Resending OTP to:", mobile);
    // 🔥 reset OTP state
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpVerified(false);

    // 🔥 restart timer
    setResendTimer(30);

  } catch (err: unknown) {
    const isResponseError =
      typeof err === "object" &&
      err !== null &&
      "response" in err;

    const responseData = isResponseError
      ? (err as { response?: { data?: { message?: string; error?: string } } }).response?.data
      : undefined;

    setError(
      responseData?.message ||
      responseData?.error ||
      "Failed to resend OTP"
    );

  } finally {
    setIsLoading(false);
  }
};
  // 📝 REGISTER
  const handleRegister = async () => {
    setError(null);

    if (!otpSent) {
      setError("Please request OTP first");
      return;
    }

    if (!otpVerified) {
      setError("Verify OTP first");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreed) {
      setError("Accept terms to continue");
      return;
    }

    try {
  setIsLoading(true);
  setPendingMessage(null);

const res = await register(mobile, otp.join(""), password, ROLE_MAP[role]);

console.log("User registered:", res);

if (res.pendingApproval) {
  // Organiser/Judge — no session was issued, nothing to fetch or log into.
  setPendingMessage(res.message ?? "Your account has been created and is awaiting admin approval.");
  return;
}

// fetch authenticated user — getProfile() alone never carries allRoles
// (that field only exists on /auth/me's response), so without this merge
// MandatoryRoleModal's "no role yet" check reads allRoles as empty right
// after a normal registration and incorrectly pops up again. Same merge
// useLogin.ts already does.
const [profile, me] = await Promise.all([getProfile(), getCurrentUser()]);

// update redux auth state
dispatch(loginSuccess({
  ...profile,
  role: me.role,
  allRoles: me.allRoles,
  assignedEventIds: me.assignedEventIds,
  assignedSportIds: me.assignedSportIds,
}));

// flag this session so the "you made it" welcome popup shows once,
// as soon as they land on their (empty) profile
localStorage.setItem("botleague_welcome_pending", "1");

// redirect
navigate("/profile", { replace: true });
} catch (err: unknown) {
  const isResponseError =
    typeof err === "object" &&
    err !== null &&
    "response" in err;

  const responseData = isResponseError
    ? (err as { response?: { data?: { message?: string; error?: string } } }).response?.data
    : undefined;

  console.log("Register error:", responseData);

  setError(
    responseData?.message ||
    responseData?.error ||
    "Registration failed"
  );

} finally {
  setIsLoading(false);
}
  };

  return {
    // state
    mobile,
    setMobile,
    otp,
    setOtp,
    otpSent,
    otpVerified,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    agreed,
    setAgreed,
    role,
    setRole,
    pendingMessage,
    resendTimer,
    isLoading,
    error,

    // actions
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleRegister,
  };
}