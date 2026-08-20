import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import Layout from "../../Navigation/pages/Layout";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import PublicBottomNav from "../../../shared/components/PublicBottomNav";
import AppFooter from "../../../shared/components/AppFooter";
import Rankings from "./Rankings";

/**
 * Rankings is viewable without an account, but its chrome still depends on
 * auth state: logged-in visitors get the normal Navbar+Sidebar shell (same
 * as every other protected page), logged-out visitors get the public
 * site header instead — no sidebar, no authenticated navbar.
 */
export default function RankingsRoute() {
  const { isAuthenticated, isAuthChecked } = useSelector((state: RootState) => state.auth);

  if (!isAuthChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Layout>
        <Rankings />
      </Layout>
    );
  }

  return (
    <>
      <PublicNavbar showLeagues />
      <Rankings />
      <AppFooter />
      <PublicBottomNav />
    </>
  );
}
