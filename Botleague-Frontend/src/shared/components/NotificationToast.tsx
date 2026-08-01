import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X } from "lucide-react";

import { useAppDispatch } from "../../app/hooks";
import type { NotificationResponse } from "../../feature/Notifications/api/notification.api";
import { getPreview } from "../../feature/Notifications/utils/notificationText";
import { markNotificationRead } from "../../feature/Notifications/store/notificationSlice";
import "../../styles/notificationToast.css";

interface NotificationToastProps {
  toastId: string;
  notification: NotificationResponse;
}

export default function NotificationToast({ toastId, notification }: NotificationToastProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleOpen = () => {
    if (!notification.read) {
      dispatch(markNotificationRead(notification.id));
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    toast.dismiss(toastId);
  };

  return (
    <div
      className="notif-toast"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      <span className="notif-toast-accent" aria-hidden="true" />
      <div className="notif-toast-body">
        <strong className="notif-toast-title">{notification.title}</strong>
        <span className="notif-toast-message">{getPreview(notification, 80)}</span>
      </div>
      <button
        type="button"
        className="notif-toast-close"
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.stopPropagation();
          toast.dismiss(toastId);
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
