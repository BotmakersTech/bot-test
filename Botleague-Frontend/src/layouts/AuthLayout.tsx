import React from "react";
import flight from "../assets/Auth/flight.svg";
import drone from "../assets/Auth/drone.svg";
import star1 from "../assets/Auth/Star-18.svg";
import star2 from "../assets/Auth/Star-19.svg";
import starTwo from "../assets/Auth/Star-two.svg";
import plane from "../assets/Auth/plane.svg";
import droneV2 from "../assets/Auth/drone-v2.svg";
import LOGO_URL from "../assets/logo.png";
import "../styles/AuthLayout.css";
import "../styles/AuthMockup.css";

interface Props {
  children: React.ReactNode;
  variant?: "default" | "login" | "register" | "forgot";
}

export default function AuthLayout({ children, variant = "default" }: Props) {
  return (
    <div className="cna-root relative min-h-screen overflow-hidden bg-white">
      {/* ---------- Background decorations ---------- */}
      {variant === "default" && (
        <>
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

          {/* Drone — right center */}
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
        </>
      )}

      {(variant === "register" || variant === "login" || variant === "forgot") && (
        <>
          <img src={starTwo} alt="" aria-hidden="true" className="cna-auth-deco absolute top-0 left-130 w-[107px] h-[108px]" />
          <img src={starTwo} alt="" aria-hidden="true" className="cna-auth-deco absolute inset-y-100 w-[248px] h-[231px]" />
          <img src={starTwo} alt="" aria-hidden="true" className="cna-auth-deco absolute left-75 bottom-35 size-[52px]" />
          <img src={starTwo} alt="" aria-hidden="true" className="cna-auth-deco absolute size-[58px] inset-y-95 inset-x-108 rotate-42 z-1" />
          <img src={starTwo} alt="" aria-hidden="true" className="cna-auth-deco absolute right-55 top-55 size-[52px]" />
          <img src={starTwo} alt="" aria-hidden="true" className="cna-auth-deco absolute size-[111px] z-1 right-101 -rotate-20 bottom-70" />
          <img src={plane} alt="" aria-hidden="true" className="cna-auth-deco absolute top-25 left-20" />
          <img src={droneV2} alt="" aria-hidden="true" className="cna-auth-deco absolute bottom-65 right-10" />
        </>
      )}

      {/* ---------- Main Content ---------- */}
      <div className="relative z-10 flex w-full min-h-screen flex-col items-center justify-center px-4 py-8 ">
        {/* Logo */}
        <div className="flex justify-center pb-6">
          <img
            src={LOGO_URL}
            alt="BotLeague"
            className={
              variant === "login" || variant === "register" || variant === "forgot"
                ? "cna-logo cna-logo--auth object-contain"
                : "cna-logo h-10 object-contain md:h-14"
            }
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Card */}
        {variant === "default" && (
          <div className="cna-card w-[692px] mx-auto px-72 rounded-xl! overflow-hidden">
            <div className="cna-card-inner px-6 py-8 sm:px-10 md:px-14 lg:px-20">
              {children}
            </div>
          </div>
        )}

        {variant === "login" && (
          <div className="cna-gradient-card--login rounded-[12px]">
            {children}
          </div>
        )}

        {(variant === "register" || variant === "forgot") && (
          <div className="cna-gradient-card--register rounded-xl w-full max-w-[692px] mx-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}