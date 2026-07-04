export default function SocialAuth() {
  return (
    <>
      <div className="flex gap-2 items-center justify-center text-[10px] md:text-[14px] py-2">
        <span className="w-14 md:w-32.5 h-px bg-black" /> OR{" "}
        <span className="w-14 md:w-32.5 h-px bg-black" />
      </div>

      <div className="flex gap-2 justify-between items-center">
        <button
          type="button"
          className="cursor-pointer text-[14px] md:text-inherit grow flex justify-center items-center
          gap-2 px-2 py-2 bg-[#D5D5D5] hover:bg-[#d5d5d582] transition-colors
          duration-150 ease-out rounded-xl active:scale-95"
        >
          Login with{" "}
          <img
            className="size-5 md:size-10"
            src="/icons/google-logo.svg"
            alt="google-icon"
          />
        </button>
        <button
          type="button"
          className="cursor-pointer text-[14px] md:text-inherit grow flex justify-center items-center
          gap-2 px-2 py-2 bg-[#D5D5D5] hover:bg-[#d5d5d582] transition-all
          duration-150 ease-out rounded-xl active:scale-95"
        >
          Login with{" "}
          <img
            className="size-5 md:size-10"
            src="/icons/facebook-logo.svg"
            alt="facebook-icon"
          />
        </button>
      </div>
    </>
  );
}