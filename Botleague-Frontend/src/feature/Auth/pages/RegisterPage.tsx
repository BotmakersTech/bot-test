import AuthLayout from "../../../layouts/AuthLayout";
import AuthCard from "../components/AuthCard";
import OtpSection from "../components/OtpSection";
import PasswordSection from "../components/PasswordSection";
import TermsSection from "../components/TermsSection";
import SocialAuth from "../components/SocialAuth";
import '../../../styles/login.css' ;
import useRegister from "../hooks/useRegister";

export default function RegisterPage() {
  const register = useRegister();

  return (
    <AuthLayout >
      <AuthCard
        title="Create New Account"
        subtitle="Start your journey in BotLeague"
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
          <p className="cna-field-error">
            {register.error}
          </p>
        )}

   <button
          onClick={register.handleRegister}
          className="cna-btn cna-btn--light cna-btn--full "
          disabled={register.isLoading}
        >
          {register.isLoading ? "Loading..." : "Create Account"}
        </button>
        {/* SUBMIT */}
     

        {/* LOGIN LINK */}
        <p className="text-sm text-center mt-4 text-(--cna-text-secondary)">
          Already have an account?{" "}
          <a href="/login" className="text-(--cna-text-link) font-semibold">
            Login
          </a>
        </p>

        {/* SOCIAL */}
        <SocialAuth />

      </AuthCard>
    </AuthLayout>
  );
}