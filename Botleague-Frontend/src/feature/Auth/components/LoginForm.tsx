import { useEffect, useRef, useState } from "react";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import googleLogo from "../../../assets/BrandLogo/google.png";
import useLogin from "../hooks/useLogin";
import useGoogleAuth from "../hooks/useGoogleAuth";

interface Size { w: number; h: number }

export default function LoginForm() {
  const login = useLogin();
  const googleAuth = useGoogleAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Google's rendered button hard-caps at width=400 (Google's own API
  // limit — not fixable via props) so it can never natively stretch to
  // match "Login"/"Create new account" (w-full, ~466-536px depending on
  // viewport). Instead: draw a custom lookalike button (real cna-login-btn
  // classes, genuinely full-width) in normal flow, and lay Google's real
  // button on top of it fully transparent, CSS-scaled up so its actual
  // clickable box covers the full custom button — the user's click always
  // lands on Google's real element (no synthetic .click(), which Google's
  // credential flow may not trust), just invisibly and at a larger hit-area
  // than Google natively allows.
  const wrapRef = useRef<HTMLDivElement>(null);
  const realBtnRef = useRef<HTMLDivElement>(null);
  const [wrapSize, setWrapSize] = useState<Size>();
  const [realSize, setRealSize] = useState<Size>();

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setWrapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = realBtnRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setRealSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const googleScale =
    wrapSize && realSize && realSize.w > 0 && realSize.h > 0
      ? { x: wrapSize.w / realSize.w, y: wrapSize.h / realSize.h }
      : null;

  return (
    <form onSubmit={login.handleLogin} className="cna-login-gap-field flex flex-col w-full">
      {/* MOBILE */}
      <div className="flex flex-col gap-1.5">
        <label className="cna-auth-label-pad cna-login-label font-medium text-black" style={{ fontFamily: "var(--auth-poppins)" }}>
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
        <label className="cna-auth-label-pad cna-login-label font-medium text-black" style={{ fontFamily: "var(--auth-poppins)" }}>
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
          className="cna-login-link self-end font-semibold text-[#8C6CFF] hover:brightness-125"
        >
          Forgot password?
        </a>
      </div>

      {/* ERROR */}
      {(login.error || googleAuth.error) && (
        <p className="cna-field-error">{login.error || googleAuth.error}</p>
      )}

      {/* Grouped Action Buttons */}
      <div className="cna-login-gap-btn flex flex-col">
        <button
          type="submit"
          disabled={login.isLoading}
          className="cna-login-btn w-full rounded-[12px] bg-gradient-to-b from-[#8C6CFF]/[0.75] to-[#0162D1]/[0.75] font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--auth-poppins)" }}
        >
          {login.isLoading ? "Loading..." : "Login"}
        </button>

        <div ref={wrapRef} className="relative w-full">
          {/* Visible lookalike — same classes as Login/Create new account, so it's genuinely the same width/height/style. Decoration only; the real click lands on the real button below. */}
          <div
            aria-hidden="true"
            className="cna-gradient-btn cna-login-btn w-full flex items-center justify-center gap-2 rounded-[12px] font-semibold text-[#0162D1] pointer-events-none"
            style={{ fontFamily: "var(--auth-poppins)" }}
          >
            <img src={googleLogo} alt="" className="w-5 h-5" />
            Sign in with Google
          </div>

          {/* Real Google button — invisible, CSS-scaled so its actual clickable box covers the lookalike above it. */}
          <div className="absolute inset-0 overflow-hidden" style={{ opacity: 0 }}>
            <div
              ref={realBtnRef}
              style={
                googleScale
                  ? { transform: `scale(${googleScale.x}, ${googleScale.y})`, transformOrigin: "top left" }
                  : undefined
              }
            >
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    googleAuth.handleGoogleCredential(credentialResponse.credential);
                  }
                }}
                onError={() => {}}
                theme="outline"
                size="large"
                shape="rectangular"
                text="signin_with"
                logo_alignment="center"
                width={400}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-black">OR</span>
        </div>

        <a
          href="/register"
          className="cna-gradient-btn cna-login-btn flex w-full items-center justify-center rounded-[12px] font-semibold text-[#0162D1]"
          style={{ fontFamily: "var(--auth-poppins)" }}
        >
          Create new account
        </a>
      </div>
    </form>
  );
}
