interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div
      className="relative max-w-173 w-full mx-auto rounded-xl bg-white
      py-6 md:px-10 lg:px-20"
    >
      <div className="text-center pt-3 md:pt-0">
        <h2 className="text-[#0162D1] font-semibold font-orbitron text-[24px] md:text-[28px] lg:text-[36px]">
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