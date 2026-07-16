import { useState } from "react";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import useLogin from "../hooks/useLogin";

export default function LoginForm() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={login.handleLogin} className="flex flex-col gap-3 md:gap-4 w-full">
      {/* MOBILE */}
      <div className="flex flex-col gap-1.5">
        <label className="cna-auth-label-pad text-[16px] md:text-[18px] lg:text-[20px] xl:text-[22px] font-medium text-black" style={{ fontFamily: "var(--auth-poppins)" }}>
          Mobile number
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-black/40" />
          <input
            type="tel"
            placeholder="Enter here"
            value={login.mobile}
            onChange={(e) =>
              login.setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className="cna-login-field-input cna-has-icon-left"
          />
        </div>
      </div>

      {/* PASSWORD */}
      <div className="flex flex-col gap-1.5">
        <label className="cna-auth-label-pad text-[16px] md:text-[18px] lg:text-[20px] xl:text-[22px] font-medium text-black" style={{ fontFamily: "var(--auth-poppins)" }}>
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-black/40" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter here"
            value={login.password}
            onChange={(e) => login.setPassword(e.target.value)}
            className="cna-login-field-input cna-has-icon-left cna-has-icon-right"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
        <a
          href="/forgot-password"
          className="self-end text-[13px] md:text-[14px] lg:text-[15px] xl:text-[16px] font-semibold text-[#8C6CFF] hover:brightness-125"
        >
          Forgot password?
        </a>
      </div>

      {/* ERROR */}
      {login.error && <p className="cna-field-error">{login.error}</p>}

      {/* Grouped Action Buttons */}
      <div className="flex flex-col gap-2 md:gap-3">
        <button
          type="submit"
          disabled={login.isLoading}
          className="h-[38px] md:h-[40px] lg:h-[42px] xl:h-[44px] w-full rounded-[12px] bg-gradient-to-b from-[#8C6CFF]/[0.75] to-[#0162D1]/[0.75] text-[14px] md:text-[15px] lg:text-[16px] xl:text-[17px] font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--auth-poppins)" }}
        >
          {login.isLoading ? "Loading..." : "Login"}
        </button>

        <button
          type="button"
          className="h-[38px] md:h-[40px] lg:h-[42px] xl:h-[44px] w-full flex items-center justify-center gap-2 rounded-[12px] bg-black/20 transition hover:bg-black/30 text-[14px] md:text-[15px] lg:text-[16px] xl:text-[17px] font-semibold text-[#0162D1]"
          style={{ fontFamily: "var(--auth-poppins)" }}
        >
          <FcGoogle className="w-4.5 h-4.5" />
          Login with Google
        </button>

        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-black">OR</span>
        </div>

        <a
          href="/register"
          className="cna-gradient-btn flex h-[38px] md:h-[40px] lg:h-[42px] xl:h-[44px] w-full items-center justify-center rounded-[12px] text-[14px] md:text-[15px] lg:text-[16px] xl:text-[17px] font-semibold text-[#0162D1]"
          style={{ fontFamily: "var(--auth-poppins)" }}
        >
          Create new account
        </a>
      </div>
    </form>
  );
}
