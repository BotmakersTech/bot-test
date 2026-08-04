import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Smartphone } from "lucide-react";
import type { RootState } from "../../app/store";
import { sendOtp, resendOTP, verifyPhone } from "../../feature/Auth/api/auth.api";
import { updateUser } from "../../feature/Auth/store/authSlice";
import OtpSection from "../../feature/Auth/components/OtpSection";
import "../../styles/onboarding.css";
import "../../styles/AuthMockup.css";

const OTP_LENGTH = 4;

/**
 * Mandatory, non-dismissible: shows once a role has been chosen and
 * user.phoneVerified === false (strict — see gate condition below). Reuses
 * OtpSection as-is. Unlike its usage during registration (where the real
 * verifyOtp() call is deferred to a later submit step because MSG91 codes
 * are single-use), this modal's only action IS the final verify, so
 * onVerifyOtp wires straight to the real endpoint — not a deviation from
 * that pattern, just a different shape of flow.
 */
export default function MandatoryPhoneVerifyModal() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // A role must already be chosen (MandatoryRoleModal handles that gate) —
  // strict === false fails safe against any code path that hasn't populated
  // phoneVerified yet, rather than spuriously gating existing users.
  const shouldShow =
    !!user && !!user.allRoles && user.allRoles.length > 0 && user.phoneVerified === false;

  if (!shouldShow) return null;

  const handleSendOtp = async () => {
    setError(null);
    if (mobile.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    try {
      setIsLoading(true);
      await sendOtp(mobile);
      setOtpSent(true);
      setResendTimer(30);
      setOtp(Array(OTP_LENGTH).fill(""));
    } catch {
      setError("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    try {
      setIsLoading(true);
      await resendOTP(mobile);
      setOtp(Array(OTP_LENGTH).fill(""));
      setResendTimer(30);
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const fullOtp = otp.join("");
    if (fullOtp.length < OTP_LENGTH) {
      setError("Enter the complete OTP");
      return;
    }
    try {
      setIsLoading(true);
      await verifyPhone(mobile, fullOtp);
      // Flips the gate condition above to false — the modal unmounts on the
      // next render, no reload needed.
      dispatch(updateUser({ phone: mobile, phoneVerified: true }));
    } catch (err: unknown) {
      const isResponseError = typeof err === "object" && err !== null && "response" in err;
      const responseData = isResponseError
        ? (err as { response?: { data?: { message?: string; error?: string } } }).response?.data
        : undefined;
      setError(responseData?.message || responseData?.error || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onb-overlay">
      <div className="onb-card" style={{ maxWidth: 440 }}>
        <div style={{ padding: "32px 28px 8px", textAlign: "center" }}>
          <div className="onb-icon-badge" style={{ margin: "0 auto 14px" }}>
            <Smartphone size={26} />
          </div>
          <h2 className="onb-title" style={{ margin: 0, fontSize: "1.15rem" }}>
            Verify your mobile number
          </h2>
          <p className="onb-subtitle" style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
            One quick step before you can use BotLeague — verify your number with an OTP.
          </p>
        </div>

        <div style={{ padding: "22px 28px 28px" }}>
          <OtpSection
            mobile={mobile}
            setMobile={setMobile}
            otp={otp}
            setOtp={setOtp}
            otpSent={otpSent}
            otpVerified={false}
            resendTimer={resendTimer}
            isLoading={isLoading}
            onSendOtp={handleSendOtp}
            onResendOtp={handleResendOtp}
            onVerifyOtp={handleVerifyOtp}
          />
          {error && (
            <p style={{ margin: "8px 0 0", color: "#dc2626", fontSize: "0.82rem", fontFamily: "Poppins, sans-serif" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
