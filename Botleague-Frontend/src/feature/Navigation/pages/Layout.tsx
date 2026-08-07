import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { Compass } from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AppFooter from "../../../shared/components/AppFooter";
import WelcomeModal from "../../../shared/components/WelcomeModal";
import MandatoryRoleModal from "../../../shared/components/MandatoryRoleModal";
import MandatoryPhoneVerifyModal from "../../../shared/components/MandatoryPhoneVerifyModal";
import OnboardingTour, { TOUR_DONE_FLAG } from "../../../shared/components/OnboardingTour";
import pageBackground from "../../../assets/background.png";
import "../../../styles/onboarding.css";

interface LayoutProps {
  /** Normally omitted — nested protected routes render via <Outlet/>. Pass
   *  content directly only when reusing this authenticated shell outside the
   *  nested-route tree (e.g. a page that's also reachable while logged out,
   *  like /rankings, and composes this shell itself for the logged-in case). */
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
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
            {children ?? <Outlet />}
          </main>
        </div>

        <AppFooter />
      </div>

      {/* Sequential mandatory gates for a fresh Google signup — role first,
          then phone+OTP. Each is a no-op (renders null) once its condition
          is satisfied, so at most one is ever visible at a time. */}
      <MandatoryRoleModal />
      <MandatoryPhoneVerifyModal />

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
