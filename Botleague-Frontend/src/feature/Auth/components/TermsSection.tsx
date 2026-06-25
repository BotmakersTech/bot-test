export default function TermsSection({ agreed, setAgreed }: { agreed: boolean; setAgreed: (value: boolean) => void }) {
  return (
    <label className="cna-terms">
      <input
        type="checkbox"
        className="cna-checkbox"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
      />

      <span className="cna-terms-text">
        By deploying your profile, you agree to the{" "}
        <a href="#" className="cna-link">Terms of Engagement</a> and{" "}
        <a href="#" className="cna-link">Privacy Protocol</a>
      </span>
    </label>
  );
}