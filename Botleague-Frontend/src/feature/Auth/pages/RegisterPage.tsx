import AuthLayout from "../../../layouts/AuthLayout";
import AuthCard from "../components/AuthCard";
import OtpSection from "../components/OtpSection";
import PasswordSection from "../components/PasswordSection";
import TermsSection from "../components/TermsSection";
import useRegister from "../hooks/useRegister";
import "../../../styles/AuthLayout.css"
export default function RegisterPage() {
  const register = useRegister();

  return (
    <AuthLayout variant="register">
      <AuthCard
        title="create new account"
        subtitle="Start your journey"
        variant="register"
      >

        {/* OTP SECTION */}
       <OtpSection
           mobile={register.mobile}
          setMobile={register.setMobile}
          otp={register.otp}
          setOtp={register.setOtp}
          otpSent={register.otpSent}
          otpVerified={register.otpVerified}
          resendTimer={register.resendTimer}
          isLoading={register.isLoading}
          onSendOtp={register.handleSendOtp}
          onResendOtp={register.handleResendOtp} // ✅ important
          onVerifyOtp={register.handleVerifyOtp}
/>

        {/* PASSWORD */}
        <PasswordSection
          password={register.password}
          setPassword={register.setPassword}
          confirmPassword={register.confirmPassword}
          setConfirmPassword={register.setConfirmPassword}
          disabled={!register.otpVerified}
        />

        {/* TERMS */}
        <TermsSection
          agreed={register.agreed}
          setAgreed={register.setAgreed}
        />

        {/* ERROR */}
        {register.error && (
          <p className="cna-field-error text-center">
            {register.error}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-0">
          <button
            type="button"
            onClick={register.handleRegister}
            disabled={register.isLoading}
            className="cna-register-submit-btn w-full rounded-lg font-semibold tracking-tight
              text-[16px] md:text-[17px] lg:text-[18px]"
            style={{ fontFamily: "var(--auth-poppins)" }}
          >
            {register.isLoading ? "Loading..." : "Create account"}
          </button>

          <div className="cna-or-divider-pad flex justify-center items-center">
            <span className="text-sm text-gray-500">OR</span>
          </div>

          <a
            href="/login"
            className="cna-border-gradient w-full rounded-lg font-semibold tracking-tight cursor-pointer
              text-[16px] md:text-[17px] lg:text-[18px] text-[#0162D1] text-center
              active:scale-[0.98] transition-transform duration-300 ease-linear"
            style={{ fontFamily: "var(--auth-poppins)" }}
          >
            Login
          </a>
        </div>

      </AuthCard>
    </AuthLayout>
  );
}