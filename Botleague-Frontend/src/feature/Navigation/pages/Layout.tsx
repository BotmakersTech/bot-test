import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#191919] text-neutral-200">
      {/* Full-width top bar */}
      <Navbar />

      {/* Sidebar + page content */}
      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#191919] ">
          <Outlet />
        </main>
      </div>
    </div>
  );
}