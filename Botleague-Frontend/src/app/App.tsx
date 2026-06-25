import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../app/store";
import { loginStart, loginSuccess, loginFailure } from "../feature/Auth/store/authSlice";
import { refreshToken, getCurrentUser } from "../feature/Auth/api/auth.api";
import { getProfile } from "../feature/Profile/api/profile.api";
import { getMyTeam } from "../feature/Team/api/team.api";

import Layout from "../routes/AppRouter";
import { RealtimeProvider } from "../shared/realtime/RealtimeProvider";
import { useNotificationRealtime } from "../shared/realtime/useNotificationRealtime";

// Refresh this many seconds before the token actually expires.
const REFRESH_BEFORE_EXPIRY_S = 120;

/** Mounts always-on subscriptions that must live for the session lifetime. */
function GlobalRealtimeSubscriptions() {
  useNotificationRealtime();
  return null;
}

function App() {
  const dispatch = useDispatch();
  const { isAuthChecked, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Timer handle for the proactive refresh
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When the current access token expires (epoch ms), 0 = unknown
  const expiresAtRef = useRef<number>(0);

  /**
   * Silently refresh the access token and reschedule the next proactive refresh.
   * Called both by the timer and by the visibilitychange listener.
   */
  const silentRefresh = useCallback(async () => {
    try {
      const result = await refreshToken();

      // Schedule next refresh
      const ttl = result.expiresIn ?? 900; // fall back to 15 min if backend is old
      expiresAtRef.current = Date.now() + ttl * 1000;

      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      const delay = Math.max((ttl - REFRESH_BEFORE_EXPIRY_S) * 1000, 5_000);
      refreshTimerRef.current = setTimeout(silentRefresh, delay);
    } catch {
      // Refresh token is gone/expired — user must log in again.
      // dispatch(clearUser()) is intentionally NOT called here: the session-expired
      // event from the axios interceptor already handles that case.
    }
  }, []);

  // Schedule or reschedule the proactive refresh after a successful token issue.
  const scheduleRefresh = useCallback((expiresIn: number) => {
    expiresAtRef.current = Date.now() + expiresIn * 1000;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = Math.max((expiresIn - REFRESH_BEFORE_EXPIRY_S) * 1000, 5_000);
    refreshTimerRef.current = setTimeout(silentRefresh, delay);
  }, [silentRefresh]);

  useEffect(() => {
    const restoreSession = async () => {
      dispatch(loginStart());
      try {
        const result = await refreshToken();

        const [profile, me] = await Promise.all([
          getProfile(),
          getCurrentUser(),
        ]);

        dispatch(
          loginSuccess({
            ...profile,
            role: me.role,
            allRoles: me.allRoles,
            assignedEventIds: me.assignedEventIds,
            assignedSportIds: me.assignedSportIds,
          })
        );

        // Schedule proactive refresh using the TTL the backend reported
        scheduleRefresh(result.expiresIn ?? 900);

        try { await getMyTeam(); } catch { /* no team — non-fatal */ }
      } catch {
        dispatch(loginFailure());
      }
    };

    restoreSession();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [dispatch, scheduleRefresh]);

  // When the user switches back to this tab after being away, check whether the
  // token is about to expire (or already has) and refresh immediately if so.
  useEffect(() => {
    if (!isAuthenticated) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const secsLeft = (expiresAtRef.current - Date.now()) / 1000;
      if (secsLeft < REFRESH_BEFORE_EXPIRY_S) {
        // Clear any pending timer and refresh right now
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        silentRefresh();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isAuthenticated, silentRefresh]);

  if (!isAuthChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <RealtimeProvider>
      <GlobalRealtimeSubscriptions />
      <Layout />
    </RealtimeProvider>
  );
}

export default App;
