import AuthLayout from "../../../layouts/AuthLayout";
import AuthCard from "../components/AuthCard";
import OtpSection from "../components/OtpSection";
import PasswordSection from "../components/PasswordSection";
import useForgotPassword from "../hooks/useForgotPassword";

const TITLE = (
  <>
    <span className="text-[#1a1a2e]">Forget </span>Password
  </>
);

export default function ForgotPasswordPage() {
  const fp = useForgotPassword();

  if (fp.mode === "email") {
    return (
      <AuthLayout variant="forgot">
        <AuthCard title={TITLE} variant="forgot">
          <div className="flex flex-col w-full" style={{ gap: "clamp(4px, 0.8dvh, 8px)" }}>
            <label className="text-[14px] md:text-[15px] font-inter text-gray-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="Example@email.com"
              value={fp.email}
              onChange={(e) => fp.setEmail(e.target.value)}
              className="cna-register-field-input"
            />
          </div>

          <p className="text-center text-[13px] md:text-[14px] font-inter text-gray-600">
            Enter your email for the verification process, we will send reset your password
            link to your email.
          </p>

          {fp.error && <p className="cna-field-error text-center">{fp.error}</p>}
          {fp.success && (
            <p className="text-green-600 text-center text-[13px] md:text-[14px] font-inter">
              {fp.success}
            </p>
          )}

          <button
            type="button"
            onClick={fp.handleSendEmailReset}
            disabled={fp.isSendingEmail}
            className="cna-register-row-btn mx-auto px-10"
          >
            {fp.isSendingEmail ? "Sending…" : "Verify"}
          </button>

          <p className="text-center text-[13px] md:text-[14px] font-inter text-gray-600">
            If you didn't receive any mail!{" "}
            <button
              type="button"
              onClick={fp.handleSendEmailReset}
              disabled={fp.isSendingEmail}
              className="text-[#0162D1] font-semibold underline underline-offset-2"
            >
              Resend
            </button>
          </p>

          <div className="cna-or-divider-pad flex justify-center items-center">
            <span className="text-sm text-gray-500">OR</span>
          </div>

          <button
            type="button"
            onClick={() => fp.setMode("mobile")}
            className="cna-border-gradient w-full rounded-lg font-semibold tracking-tight cursor-pointer
              text-[16px] md:text-[17px] lg:text-[18px] text-[#0162D1] text-center
              active:scale-[0.98] transition-transform duration-300 ease-linear"
            style={{ fontFamily: "var(--auth-poppins)" }}
          >
            Reset via Mobile Number
          </button>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="forgot">
      <AuthCard title={TITLE} variant="forgot">
        {/* MOBILE + OTP */}
        <OtpSection
          mobile={fp.mobile}
          setMobile={fp.setMobile}
          otp={fp.otp}
          setOtp={fp.setOtp}
          otpSent={fp.otpSent}
          otpVerified={fp.otpVerified}
          resendTimer={fp.resendTimer}
          isLoading={fp.isOtpBusy}
          onSendOtp={fp.handleSendOtp}
          onResendOtp={fp.handleResendOtp}
          onVerifyOtp={fp.handleVerifyOtp}
        />

        <p className="text-center text-[13px] md:text-[14px] font-inter text-gray-600">
          Set the new password for your account so you can login and access all features.
        </p>

        {/* NEW PASSWORD */}
        <PasswordSection
          password={fp.password}
          setPassword={fp.setPassword}
          confirmPassword={fp.confirmPassword}
          setConfirmPassword={fp.setConfirmPassword}
          disabled={!fp.otpVerified}
        />

        {fp.error && <p className="cna-field-error text-center">{fp.error}</p>}
        {fp.success && (
          <p className="text-green-600 text-center text-[13px] md:text-[14px] font-inter">
            {fp.success}
          </p>
        )}

        <div className="flex flex-col gap-0">
          <button
            type="button"
            onClick={fp.handleUpdatePassword}
            disabled={fp.isUpdatingPassword || !fp.otpVerified}
            className="cna-register-submit-btn w-full rounded-lg font-semibold tracking-tight
              text-[16px] md:text-[17px] lg:text-[18px]"
            style={{ fontFamily: "var(--auth-poppins)" }}
          >
            {fp.isUpdatingPassword ? "Updating…" : "Update password"}
          </button>

          <div className="cna-or-divider-pad flex justify-center items-center">
            <span className="text-sm text-gray-500">OR</span>
          </div>

          <button
            type="button"
            onClick={() => fp.setMode("email")}
            className="cna-border-gradient w-full rounded-lg font-semibold tracking-tight cursor-pointer
              text-[16px] md:text-[17px] lg:text-[18px] text-[#0162D1] text-center
              active:scale-[0.98] transition-transform duration-300 ease-linear"
            style={{ fontFamily: "var(--auth-poppins)" }}
          >
            Reset via Mail ID
          </button>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
