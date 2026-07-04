import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputClass =
  "w-full font-inter text-[14px] md:text-[16px] text-[#5c5c5c] " +
  "placeholder:text-[#999797] bg-[#bdbdbd2b] rounded-xl " +
  "border border-[#BDBDBD] py-2.5 pl-4 pr-11 md:py-4 md:pl-5 md:pr-12 " +
  "shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] focus:shadow-none " +
  "focus:outline-none focus:border-[#BDBDBD] " +
  "transition-shadow duration-150 ease-in " +
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
}: {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  disabled: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const match = confirmPassword === password;

  return (
    <div className="flex flex-col w-full">
      {/* PASSWORD */}
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

      {/* CONFIRM PASSWORD */}
      <div className="w-full mt-4 md:mt-5">
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
          <p className="text-red-500 text-[10px] md:text-[12px] font-inter mt-1">
            Passwords do not match
          </p>
        )}

        {confirmPassword && match && (
          <p className="text-green-600 text-[10px] md:text-[12px] font-inter mt-1">
            Passwords match ✔
          </p>
        )}
      </div>

      {/* HINT — purple, left aligned */}
      <p className="text-[#8C6CFF] text-[11px] md:text-[14px] font-inter text-left mt-2 md:mt-3">
        *Use at least 8 characters, including a number and a symbol
      </p>
    </div>
  );
}