export default function TermsSection({
  agreed,
  setAgreed,
}: {
  agreed: boolean;
  setAgreed: (value: boolean) => void;
}) {
  return (
    <div className="self-center flex justify-center items-start max-w-xl gap-1">
      <input
        type="checkbox"
        className="cna-checkbox-nudge size-[16px] cursor-pointer flex-shrink-0"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
      />

      <a
        href="#"
        className="min-w-0 text-[13px] md:text-[14px] text-center text-gray-600 text-pretty"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        By deploying your profile, you agree to the{" "}
        <span className="text-[#0162D1]">Terms of Engagement and Privacy Protocol</span>
      </a>
    </div>
  );
}