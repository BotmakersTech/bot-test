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
  const match = confirmPassword === password;

  return (
    <div className="cna-password-group">
      <input
        type="password"
        className="cna-input"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={disabled}
      />

      <div className="cna-input-wrapper">
        <input
          type="password"
          className="cna-input"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={disabled}
        />

        {confirmPassword && !match && (
          <p className="cna-field-error">Passwords do not match</p>
        )}

        {confirmPassword && match && (
          <p className="cna-field-success">Passwords match ✔</p>
        )}
      </div>

      <p className="cna-hint">
        * Use at least 8 characters, including a number and a symbol
      </p>
    </div>
  );
}