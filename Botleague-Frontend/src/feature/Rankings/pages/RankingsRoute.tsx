import PublicNavbar from "../../../shared/components/PublicNavbar";
import PublicBottomNav from "../../../shared/components/PublicBottomNav";
import AppFooter from "../../../shared/components/AppFooter";
import Rankings from "./Rankings";

/**
 * Rankings always renders the public site shell — no sidebar — whether the
 * visitor is logged in or not. PublicNavbar/PublicBottomNav are already
 * auth-aware on their own (Login vs Dashboard, etc.), so a logged-in
 * visitor still sees the right account state here without needing the
 * authenticated Navbar+Sidebar Layout other protected pages use.
 */
export default function RankingsRoute() {
  return (
    <>
      <PublicNavbar showLeagues />
      <Rankings />
      <AppFooter />
      <PublicBottomNav />
    </>
  );
}
