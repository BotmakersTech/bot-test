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
  className="shadow-xs text-white tracking-wide cursor-pointer text-[14px] md:text-[18px] w-full bg-custom-gradient
  px-1.5 py-2.5 md:py-4 md:px-2 font-poppins font-semibold rounded-xl transition-transform duration-150 active:scale-95
  disabled:opacity-60 disabled:cursor-not-allowed"
  disabled={register.isLoading}
>
  {register.isLoading ? "Loading..." : "Create Account"}
</button>

{register.error && (
  <p className="text-red-500 text-[10px] md:text-[12px] font-inter text-center">
    {register.error}
  </p>
)}
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