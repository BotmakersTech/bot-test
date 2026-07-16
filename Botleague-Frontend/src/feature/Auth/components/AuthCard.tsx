interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "default" | "login" | "register";
}

export default function AuthCard({ title, subtitle, children, variant = "default" }: Props) {
  if (variant === "login") {
    return (
      <div className="relative flex flex-col items-center w-full gap-4 md:gap-5 lg:gap-6">
        <h2 className="cna-auth-label-pad text-center text-[26px] md:text-[30px] lg:text-[34px] xl:text-[38px] font-semibold text-[#0162D1]" style={{ fontFamily: "var(--auth-poppins)" }}>
          {title}
        </h2>
        <div className="cna-login-form-pad flex flex-col w-full max-w-[466px] gap-3 md:gap-4">
          {children}
        </div>
      </div>
    );
  }

  if (variant === "register") {
    return (
      <div className="relative flex flex-col gap-2 md:gap-3 lg:gap-4 xl:gap-5 w-full">
        <div className="text-center">
          <h2 className="text-[22px] md:text-[26px] lg:text-[32px] xl:text-[36px] text-[#0162D1] font-semibold capitalize" style={{ fontFamily: "var(--auth-poppins)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-[14px] md:text-[16px] lg:text-[18px] xl:text-[20px] font-semibold">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 md:gap-4">{children}</div>
      </div>
    );
  }

  return (
    <div
      className="relative max-w-173 w-full mx-auto rounded-xl bg-white
      py-6 md:px-10 lg:px-20"
    >
      <div className="text-center pt-3 md:pt-0 mb-5 cna-form-header">
        <h2 className="cna-title text-[#0162D1] font-semibold  text-[24px] md:text-[28px] lg:text-[36px]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] md:text-[16px] lg:text-[20px] font-inter md:font-semibold text-black/80">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 py-4 md:py-6 px-2">{children}</div>
    </div>
  );
}