import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { Compass } from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AppFooter from "../../../shared/components/AppFooter";
import WelcomeModal from "../../../shared/components/WelcomeModal";
import OnboardingTour, { TOUR_DONE_FLAG } from "../../../shared/components/OnboardingTour";
import pageBackground from "../../../assets/background.png";
import "../../../styles/onboarding.css";

export default function Layout() {
  const [tourOpen, setTourOpen] = useState(false);

  const openTour = useCallback(() => setTourOpen(true), []);
  const closeTour = useCallback(() => setTourOpen(false), []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAFAFE] text-[#111111]">
      {/* Full-width top bar */}
      <Navbar />

      <div
        className="min-h-0 flex-1 overflow-y-auto bg-white bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: `url(${pageBackground})` }}
      >
        {/* Sidebar + page content */}
        <div className="flex min-h-[calc(100vh-4.5rem)]">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>

        <AppFooter />
      </div>

      <WelcomeModal onTakeTour={openTour} />
      {tourOpen && <OnboardingTour onClose={closeTour} />}

      {!tourOpen && localStorage.getItem(TOUR_DONE_FLAG) !== "1" && (
        <button
          type="button"
          className="onb-tour-relaunch"
          onClick={openTour}
          title="Take the site tour"
          aria-label="Take the site tour"
        >
          <Compass size={20} />
        </button>
      )}
    </div>
  );
}
