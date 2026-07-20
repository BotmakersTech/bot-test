import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Check } from "lucide-react";
import AuthLayout from "../../../layouts/AuthLayout";
import AuthCard from "../components/AuthCard";
import PasswordSection from "../components/PasswordSection";
import { resetPasswordWithToken } from "../api/auth.api";

const TITLE = (
  <>
    <span className="text-[#1a1a2e]">Forget </span>Password
  </>
);

const err = (e: unknown): string => {
  if (axios.isAxiosError(e))
    return e.response?.data?.message ?? e.response?.data?.error ?? "Reset failed. The link may have expired.";
  return "Something went wrong";
};

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Invalid / missing token
  if (!token) {
    return (
      <AuthLayout variant="forgot">
        <AuthCard title={TITLE} variant="forgot">
          <div className="flex flex-col items-center text-center" style={{ gap: "clamp(10px, 1.8dvh, 20px)" }}>
            <p className="text-[15px] md:text-[16px] font-inter text-gray-700">
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <a
              href="/forgot-password"
              className="cna-register-submit-btn w-full rounded-lg font-semibold tracking-tight text-center
                text-[16px] md:text-[17px] lg:text-[18px]"
              style={{ fontFamily: "var(--auth-poppins)" }}
            >
              Request New Link
            </a>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  const handleSubmit = async () => {
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await resetPasswordWithToken({ token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setError(err(e));
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout variant="forgot">
        <AuthCard title={TITLE} variant="forgot">
          <div className="flex flex-col items-center text-center" style={{ gap: "clamp(14px, 2.4dvh, 28px)" }}>
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 78,
                height: 78,
                background: "#E4E7FC",
                border: "2px solid #6f79f0",
              }}
            >
              <Check className="w-9 h-9" style={{ color: "#4F6EF7" }} strokeWidth={2.5} />
            </div>

            <p
              className="font-semibold text-[#4F6EF7]"
              style={{ fontFamily: "var(--auth-poppins)", fontSize: "clamp(17px, 2.6dvh, 22px)" }}
            >
              Password reset successfully
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="cna-register-submit-btn w-full rounded-lg font-semibold tracking-tight uppercase
                text-[16px] md:text-[17px] lg:text-[18px]"
              style={{ fontFamily: "var(--auth-poppins)" }}
            >
              Login
            </button>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="forgot">
      <AuthCard title={TITLE} variant="forgot">
        <PasswordSection
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          disabled={false}
          labels={{ password: "Enter new password", confirm: "confirm password" }}
          hideHint
        />

        {error && <p className="cna-field-error text-center">{error}</p>}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isLoading}
          className="cna-register-submit-btn w-full rounded-lg font-semibold tracking-tight uppercase
            text-[16px] md:text-[17px] lg:text-[18px]"
          style={{ fontFamily: "var(--auth-poppins)" }}
        >
          {isLoading ? "Updating…" : "Update"}
        </button>
      </AuthCard>
    </AuthLayout>
  );
}
