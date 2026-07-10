import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AppFooter from "../../../shared/components/AppFooter";
import pageBackground from "../../../assets/background.png";

export default function Layout() {
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
    </div>
  );
}
