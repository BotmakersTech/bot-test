import { useState, useEffect } from "react";
import { sendOtp, verifyOtp, resendOTP, register } from "../api/auth.api";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../../Profile/api/profile.api";
import { loginSuccess } from "../store/authSlice";
import { useAppDispatch } from "../../../app/hooks";
const OTP_LENGTH = 4;

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

  // ⏱ OTP resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((v) => v - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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

 const handleVerifyOtp = async () => {
  setError(null);

  const fullOtp = otp.join("");

  if (fullOtp.length < 4) {
    setError("Enter complete OTP");
    return;
  }

  try {
    setIsLoading(true);

    const res = await verifyOtp(mobile, fullOtp);

    console.log("OTP success response:", res);

    if (res.success) {
      setOtpVerified(true);
    } else {
      setOtpVerified(false);
      setError(res.message);
    }

  } catch (err: unknown) {
    const isResponseError =
      typeof err === "object" &&
      err !== null &&
      "response" in err;

    const errorMessage = isResponseError
      ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
      : undefined;

    console.log(
      "OTP error response:",
      isResponseError
        ? (err as { response?: { data?: unknown } }).response?.data
        : undefined
    );

    setOtpVerified(false);

    // 🔥 THIS IS IMPORTANT
    setError(
      errorMessage || "OTP verification failed"
    );

  } finally {
    setIsLoading(false);
  }
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

const res = await register(mobile, otp.join(""), password);

console.log("User registered:", res);

// fetch authenticated user
const user = await getProfile();

// update redux auth state
dispatch(loginSuccess(user));

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


