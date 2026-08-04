import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { googleSignIn, getCurrentUser } from "../api/auth.api";
import { getProfile } from "../../Profile/api/profile.api";
import { loginSuccess, loginFailure } from "../store/authSlice";
import { getPrimaryRole } from "../../../shared/config/sidebarConfig";
import { AppRole } from "../../../shared/constants/roles";

const ROLE_HOME: Record<string, string> = {
  [AppRole.SUPER_ADMIN]: "/super-admin-dashboard",
  [AppRole.ADMIN]:       "/admin-dashboard",
  [AppRole.ORGANISER]:   "/organizer-dashboard",
  [AppRole.EVENT_HEAD]:  "/organizer-dashboard",
  [AppRole.SPORT_HEAD]:  "/organizer-dashboard",
  [AppRole.COMPETITOR]:  "/user-dashboard",
};

/**
 * Mirrors useLogin's exact post-auth sequence. A fresh Google signup lands
 * here with no role yet — getPrimaryRole([]) safely falls back to COMPETITOR
 * (-> /user-dashboard), and the mandatory role/phone modals mounted in
 * Layout.tsx take over from there.
 */
export default function useGoogleAuth() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    try {
      setIsLoading(true);

      await googleSignIn(idToken);

      const [profile, me] = await Promise.all([getProfile(), getCurrentUser()]);

      dispatch(loginSuccess({
        ...profile,
        role: me.role,
        allRoles: me.allRoles,
        assignedEventIds: me.assignedEventIds,
        assignedSportIds: me.assignedSportIds,
      }));

      const allRoles = me.allRoles ?? (me.role ? [me.role] : []);
      const primary = getPrimaryRole(allRoles);
      navigate(ROLE_HOME[primary] ?? "/user-dashboard", { replace: true });
    } catch (err: unknown) {
      const isResponseError = typeof err === "object" && err !== null && "response" in err;
      const responseData = isResponseError
        ? (err as { response?: { data?: { message?: string; error?: string } } }).response?.data
        : undefined;

      dispatch(loginFailure());
      setError(responseData?.message || responseData?.error || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, handleGoogleCredential };
}
