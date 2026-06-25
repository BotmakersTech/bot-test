import mascote from ".././assets/mascote.png";
import bg_1 from ".././assets/bg-1.png";
import bg_2 from ".././assets/bg-2.png";

const LOGO_URL = "https://botleague.in/logo/bot.png";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="cna-root">

      {/* Background Images */}
      {bg_1 && (
        <img
          src={bg_1}
          alt=""
          aria-hidden="true"
          className="cna-bg cna-bg--top-right"
        />
      )}

      {bg_2 && (
        <img
          src={bg_2}
          alt=""
          aria-hidden="true"
          className="cna-bg cna-bg--bottom-left"
        />
      )}

      <div className="cna-card">

        {/* LEFT PANEL (STATIC) */}
        <div className="cna-panel cna-panel--left">

          {/* Logo */}
          <img
            src={LOGO_URL}
            alt="BotLeague"
            className="cna-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />

          {/* Mascot */}
          <div className="cna-mascot-wrapper">
            {mascote && (
              <img
                src={mascote}
                alt="Mascot"
                className="cna-mascot"
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL (DYNAMIC CONTENT) */}
        <div className="cna-panel cna-panel--right">
          {children}
        </div>

      </div>
    </div>
  );
}