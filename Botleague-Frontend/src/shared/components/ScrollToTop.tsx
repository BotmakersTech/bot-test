import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router doesn't reset scroll position on navigation — the browser
 * keeps whatever offset the previous page was at. On a short page that
 * offset can already be past its own content, landing the visitor at the
 * footer instead of the top. Mounted once above the route tree so every
 * pathname change resets scroll, matching normal multi-page-site behavior.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
