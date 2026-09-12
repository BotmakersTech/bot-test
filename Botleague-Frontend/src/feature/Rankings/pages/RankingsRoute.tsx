import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import Layout from "../../Navigation/pages/Layout";
import PublicNavbar from "../../../shared/components/PublicNavbar";
import PublicBottomNav from "../../../shared/components/PublicBottomNav";
import AppFooter from "../../../shared/components/AppFooter";
import Rankings from "./Rankings";

/**
 * Two distinct ways to land on /rankings, two distinct shells:
 * - Through the sidebar (already inside the authenticated app) -> the
 *   normal Navbar+Sidebar Layout every other protected page uses, no
 *   podium hero (that's a public-page flourish, out of place next to a
 *   sidebar).
 * - Through the public navbar (marketing site, logged in or not) -> the
 *   public shell, no sidebar, WITH the podium hero.
 * isAuthenticated is the only signal available at this route boundary,
 * and in practice it lines up exactly with "which nav did they come
 * through" — a sidebar is only ever visible once logged in.
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
      <Rankings showPodium />
      <AppFooter />
      <PublicBottomNav />
    </>
  );
}
