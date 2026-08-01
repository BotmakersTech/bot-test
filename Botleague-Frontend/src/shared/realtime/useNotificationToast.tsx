import { useEffect } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

import type { RootState } from "../../app/store";
import { useRealtime } from "./RealtimeProvider";
import type { NotificationResponse } from "../../feature/Notifications/api/notification.api";
import type { RealtimeMessage } from "./realtimeTypes";
import NotificationToast from "../components/NotificationToast";

/**
 * Always-on hook: subscribes to the user's private queue and pops an
 * in-app toast for each incoming notification.
 *
 * Kept separate from useNotificationRealtime (which hydrates Redux) so the
 * "update the store" and "show a popup" concerns stay independently
 * toggleable later (e.g. a future "disable toasts" preference).
 *
 * Mount this once at the app level, alongside useNotificationRealtime.
 */
export function useNotificationToast() {
  const { subscribe, connected } = useRealtime();
  const userId = useSelector((s: RootState) => s.auth.user?.id);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribe("/user/queue/updates", (frame) => {
      try {
        const msg: RealtimeMessage = JSON.parse(frame.body);
        if (msg.type === "NOTIFICATION_NEW") {
          const notification = msg.payload as NotificationResponse;
          toast.custom(
            (t) => <NotificationToast toastId={t.id} notification={notification} />,
            { duration: 6000 }
          );
        }
      } catch {
        // malformed frame — ignore
      }
    });

    return unsubscribe;
  }, [userId, subscribe, connected]);
}
