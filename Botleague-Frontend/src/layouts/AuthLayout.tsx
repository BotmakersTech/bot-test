import flight from ".././assets/Auth/flight.svg";
import drone from ".././assets/Auth/drone.svg";
import star1 from ".././assets/Auth/Star-18.svg";
import star2 from ".././assets/Auth/Star-19.svg";
import "../styles/AuthLayout.css";

const LOGO_URL = "https://botleague.in/logo/bot.png";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="cna-root relative min-h-screen overflow-hidden bg-white">
      {/* ---------- Background decorations (fixed corners, behind card) ---------- */}

      {/* Plane — upper left */}
      <img
        src={flight}
        alt=""
        aria-hidden="true"
        className="cna-bg cna-bg--flight"
      />

      {/* Big star — top right */}
      <img
        src={star1}
        alt=""
        aria-hidden="true"
        className="cna-bg cna-bg--star-tr"
      />

      {/* Drone — right, vertically centered-ish */}
      <img
        src={drone}
        alt=""
        aria-hidden="true"
        className="cna-bg cna-bg--drone"
      />

      {/* Small star — bottom left */}
      <img
        src={star2}
        alt=""
        aria-hidden="true"
        className="cna-bg cna-bg--star-bl"
      />

      {/* ---------- Foreground content ---------- */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <div className="flex justify-center pb-6">
          <img
            src={LOGO_URL}
            alt="BotLeague"
            className="cna-logo h-10 md:h-14 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Card — gradient border, white body */}
        <div className="cna-card w-full max-w-170">
          <div className="cna-card-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}