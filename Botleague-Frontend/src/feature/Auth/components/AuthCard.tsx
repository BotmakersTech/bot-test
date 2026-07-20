interface Props {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "default" | "login" | "register" | "forgot";
}

export default function AuthCard({
  title,
  subtitle,
  children,
  variant = "default",
}: Props) {
  /* ─────────────────────────────────────────────────────────────────────────
   *  Shared idea: gaps and font-sizes are driven by `clamp()` with a `dvh`
   *  middle value so they SHRINK on short viewports (phones landscape, small
   *  laptops) and expand on tall ones (1512×864 target), all without JS.
   *
   *  clamp(MIN, PREFERRED, MAX)
   *    MIN  – never smaller than this (e.g. 2px)
   *    PREFERRED – scales with viewport height (e.g. 1.2dvh)
   *    MAX  – never bigger than this (e.g. 24px)
   * ───────────────────────────────────────────────────────────────────────── */

  if (variant === "login") {
    return (
      <div
        className="relative flex flex-col items-center w-full"
        style={{ gap: "clamp(10px, 2dvh, 24px)" }}
      >
        <h2
          className="cna-auth-label-pad text-center font-semibold text-[#0162D1]"
          style={{
            fontFamily: "var(--auth-poppins)",
            /* 26px → 38px, scaled by dvh so it shrinks on short screens */
            fontSize: "clamp(22px, 4dvh, 38px)",
          }}
        >
          {title}
        </h2>

        <div
          className="cna-login-form-pad flex flex-col w-full max-w-[466px]"
          style={{ gap: "clamp(8px, 1.6dvh, 16px)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (variant === "register" || variant === "forgot") {
    return (
      <div
        className="relative flex flex-col w-full"
        style={{ gap: "clamp(6px, 1.2dvh, 16px)" }}
      >
        <div className="text-center">
          <h2
            className="text-[#0162D1] font-semibold capitalize"
            style={{
              fontFamily: "var(--auth-poppins)",
              fontSize: "clamp(20px, 3.8dvh, 36px)",
            }}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              className="font-semibold"
              style={{ fontSize: "clamp(13px, 1.8dvh, 20px)" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Inner gap also shrinks on short screens */}
        <div
          className="flex flex-col"
          style={{ gap: "clamp(6px, 1.5dvh, 12px)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  /* ── default variant ──────────────────────────────────────────────────── */
  return (
    <div
      className="relative max-w-173 w-full mx-auto rounded-xl bg-white"
      style={{
        paddingTop:    "clamp(12px, 2dvh,  24px)",
        paddingBottom: "clamp(12px, 2dvh,  24px)",
        paddingLeft:   "clamp(16px, 3vw,   80px)",
        paddingRight:  "clamp(16px, 3vw,   80px)",
      }}
    >
      <div
        className="text-center cna-form-header"
        style={{ marginBottom: "clamp(10px, 1.8dvh, 20px)" }}
      >
        <h2
          className="cna-title text-[#0162D1] font-semibold"
          style={{ fontSize: "clamp(20px, 3.6dvh, 36px)" }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className="font-inter font-semibold text-black/80"
            style={{ fontSize: "clamp(11px, 1.6dvh, 20px)" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div
        className="flex flex-col px-2"
        style={{
          gap:          "clamp(8px, 1.4dvh, 24px)",
          paddingTop:   "clamp(8px, 1.4dvh, 24px)",
          paddingBottom:"clamp(8px, 1.4dvh, 24px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}