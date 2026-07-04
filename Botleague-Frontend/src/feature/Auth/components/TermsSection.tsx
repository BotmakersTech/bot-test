export default function TermsSection({
  agreed,
  setAgreed,
}: {
  agreed: boolean;
  setAgreed: (value: boolean) => void;
}) {
  return (
    <div className="relative flex justify-center items-start gap-2 md:py-2">
      <input
        className="cursor-pointer md:size-5 mt-0.5"
        type="checkbox"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
      />

      <p className="text-[10px] md:text-[14px] text-center font-inter">
        By deploying your profile, you agree to the{" "}
        <a href="#" className="text-[#0162D1]">Terms of Engagement</a>{" "}
        and <a href="#" className="text-[#0162D1]">Privacy Protocol</a>
      </p>
    </div>
  );
}