import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputClass =
  "cna-register-field-input cna-has-eye " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const eyeButtonClass =
  "absolute right-3.5 md:right-4 top-1/2 -translate-y-1/2 " +
  "text-[#999797] hover:text-[#5c5c5c] cursor-pointer " +
  "transition-colors duration-150 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export default function PasswordSection({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  disabled,
  labels,
  hideHint = false,
}: {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  disabled: boolean;
  /** Optional labels shown above each field (e.g. reset-password's mockup) — omit for the register flow's placeholder-only look. */
  labels?: { password: string; confirm: string };
  /** Reset-password's mockup has no "*Use at least 8 characters…" hint line — register's does. */
  hideHint?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const match = confirmPassword === password;

  return (
    <div
      className="flex flex-col w-full"
      style={{ gap: "clamp(6px, 1.2dvh, 16px)" }}
    >
      {/* PASSWORD */}
      <div className="flex flex-col gap-1.5 w-full">
        {labels && (
          <label className="text-[14px] md:text-[15px] font-inter text-gray-700">
            {labels.password}
          </label>
        )}
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            className={eyeButtonClass}
          >
            {showPassword ? (
              <EyeOff className="w-4.5 h-4.5 md:w-5 md:h-5" />
            ) : (
              <Eye className="w-4.5 h-4.5 md:w-5 md:h-5" />
            )}
          </button>
        </div>
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="flex flex-col gap-1.5 w-full">
        {labels && (
          <label className="text-[14px] md:text-[15px] font-inter text-gray-700">
            {labels.confirm}
          </label>
        )}
        <div className="relative w-full">
          <input
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={disabled}
            className={inputClass}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            onClick={() => setShowConfirm((v) => !v)}
            disabled={disabled}
            className={eyeButtonClass}
          >
            {showConfirm ? (
              <EyeOff className="w-4.5 h-4.5 md:w-5 md:h-5" />
            ) : (
              <Eye className="w-4.5 h-4.5 md:w-5 md:h-5" />
            )}
          </button>
        </div>

        {confirmPassword && !match && (
          <p className="text-red-500 text-[10px] md:text-[12px] font-inter">
            Passwords do not match
          </p>
        )}

        {confirmPassword && match && (
          <p className="text-green-600 text-[10px] md:text-[12px] font-inter">
            Passwords match ✔
          </p>
        )}
      </div>

      {/* HINT */}
      {!hideHint && (
        <p className="cna-register-hint-pad text-center lg:text-start text-[13px] md:text-[14px] text-[#8C6CFF] text-pretty">
          *Use at least 8 characters, including a number &amp; a symbol
        </p>
      )}
    </div>
  );
}