import React from "react";
import flight from "../assets/Auth/flight.svg";
import drone from "../assets/Auth/drone.svg";
import star1 from "../assets/Auth/Star-18.svg";
import star2 from "../assets/Auth/Star-19.svg";
import LOGO_URL from "../assets/logo.png";
import "../styles/AuthLayout.css";


interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="cna-root relative min-h-screen overflow-hidden bg-white">
      {/* ---------- Background decorations ---------- */}

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

      {/* ---------- Main Content ---------- */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 ">
        {/* Logo */}
        <div className="flex justify-center pb-6">
          <img
            src={LOGO_URL}
            alt="BotLeague"
            className="cna-logo h-10 object-contain md:h-14"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Card */}
        <div className="cna-card w-[692px] mx-auto px-72 rounded-xl! overflow-hidden">
          <div className="cna-card-inner px-6 py-8 sm:px-10 md:px-14 lg:px-20">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}