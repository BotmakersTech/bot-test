import useLogin from "../hooks/useLogin";
import SocialAuth from "./SocialAuth";

export default function LoginForm() {
  const login = useLogin();

  return (
    <form className="cna-form" onSubmit={login.handleLogin}>

      {/* MOBILE */}
      <input
        type="tel"
        placeholder="Mobile No"
        value={login.mobile}
        onChange={(e) =>
          login.setMobile(
            e.target.value.replace(/\D/g, "").slice(0, 10)
          )
        }
        className="cna-input"
      />

      {/* PASSWORD */}
      <input
        type="password"
        placeholder="Password"
        value={login.password}
        onChange={(e) => login.setPassword(e.target.value)}
        className="cna-input"
      />

      {/* FORGOT PASSWORD */}
      <p className="cna-link" style={{ fontSize: "0.8rem" }}>
       <a href="/forgot-password"> Forgot Password ?</a>
      </p>

      {/* TERMS */}
      <label className="cna-terms">
        <input
          type="checkbox"
          className="cna-checkbox"
          checked={login.agreed}
          onChange={(e) => login.setAgreed(e.target.checked)}
        />
        <span className="cna-terms-text">
          By signing in, you accept the{" "}
          <a href="/terms-of-service" className="cna-link">Terms of Service</a>{" "}
          and acknowledge our{" "}
          <a href="/privacy-policy" className="cna-link">Privacy Policy</a>.
        </span>
      </label>

      {/* ERROR */}
      {login.error && (
        <p className="cna-field-error">{login.error}</p>
      )}

      {/* BUTTON */}
      <button
        type="submit"
        className="cna-btn cna-btn--light cna-btn--full"
        disabled={login.isLoading}
      >
        {login.isLoading ? "Loading..." : "Login"}
      </button>

      {/* REGISTER LINK */}
      <p className="cna-login-prompt">
        Don’t have an account?{" "}
        <a href="/register" className="cna-link cna-link--bold">
          Create New Account
        </a>
      </p>

      {/* SOCIAL */}
      <SocialAuth />

    </form>
  );
}