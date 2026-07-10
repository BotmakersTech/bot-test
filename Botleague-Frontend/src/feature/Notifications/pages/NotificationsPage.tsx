import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import flightDecoration from "../../../assets/Auth/flight.svg";
import "../../../styles/notifications.css";
import type { NotificationResponse } from "../api/notification.api";
import {
  fetchMyNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  selectNotifLoading,
  selectNotifTotalPages,
  selectNotifications,
} from "../store/notificationSlice";

type TabKey = "all" | "team" | "join" | "sport" | "match";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "team", label: "Team Invites" },
  { key: "join", label: "Join Requests" },
  { key: "sport", label: "Sport Updates" },
  { key: "match", label: "Match Updates" },
];

const demoNotifications: NotificationResponse[] = [
  {
    id: "demo-message-week",
    title: "Alex Morgan messaged you",
    message: "How are you?",
    type: "MESSAGE",
    priority: "LOW",
    targetType: "USER",
    actionUrl: "/messages",
    custom: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "demo-join-week",
    title: "Michael J wants to join your team.",
    message: "",
    type: "JOIN_REQUEST",
    priority: "HIGH",
    targetType: "TEAM",
    actionUrl: "/my-team",
    custom: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "demo-follow-month-a",
    title: "Ajay Jadhav started following you.",
    message: "",
    type: "FOLLOW",
    priority: "LOW",
    targetType: "USER",
    custom: false,
    createdAt: new Date("2026-05-20T12:00:00").toISOString(),
    read: true,
  },
  {
    id: "demo-follow-month-b",
    title: "Shreyash Patel started following you.",
    message: "",
    type: "FOLLOW",
    priority: "LOW",
    targetType: "USER",
    custom: false,
    createdAt: new Date("2026-05-18T12:00:00").toISOString(),
    read: true,
  },
  {
    id: "demo-message-month",
    title: "Alex Morgan messaged you",
    message: "Hello.",
    type: "MESSAGE",
    priority: "LOW",
    targetType: "USER",
    actionUrl: "/messages",
    custom: false,
    createdAt: new Date("2026-05-15T12:00:00").toISOString(),
    read: true,
  },
];

function notificationMatchesTab(notification: NotificationResponse, tab: TabKey) {
  const type = notification.type.toUpperCase();
  const text = `${notification.title} ${notification.message}`.toUpperCase();

  if (tab === "all") return true;
  if (tab === "team") return type.includes("INVITE") || text.includes("INVITE");
  if (tab === "join") return type.includes("JOIN") || text.includes("JOIN");
  if (tab === "sport") return type.includes("SPORT") || type.includes("EVENT") || type.includes("REGISTRATION");
  if (tab === "match") return type.includes("MATCH") || type.includes("RESULT");
  return true;
}

function countForTab(notifications: NotificationResponse[], tab: TabKey) {
  if (tab === "all" || tab === "team") return 0;
  return notifications.filter((notification) => notificationMatchesTab(notification, tab)).length;
}

function isThisWeek(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function relativeTime(dateStr: string) {
  const then = new Date(dateStr);
  const diffDays = Math.max(0, Math.floor((Date.now() - then.getTime()) / (24 * 60 * 60 * 1000)));

  if (diffDays === 0) return "Today";
  if (diffDays < 7) return `${diffDays}d`;

  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(notification: NotificationResponse) {
  const words = notification.title.replace(/[^\w\s]/g, "").trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]).join("").toUpperCase() || "BL";
}

function avatarClass(notification: NotificationResponse) {
  const type = notification.type.toUpperCase();
  if (type.includes("JOIN") || type.includes("INVITE")) return "notif-avatar notif-avatar-warm";
  if (type.includes("FOLLOW")) return "notif-avatar notif-avatar-sky";
  if (type.includes("MATCH") || type.includes("SPORT")) return "notif-avatar notif-avatar-purple";
  return "notif-avatar";
}

function getActionKind(notification: NotificationResponse) {
  const type = notification.type.toUpperCase();
  const text = `${notification.title} ${notification.message}`.toUpperCase();

  if (type.includes("JOIN") || text.includes("JOIN YOUR TEAM")) return "join";
  if (type.includes("FOLLOW") || text.includes("FOLLOWING")) return notification.read ? "following" : "follow";
  if (type.includes("MESSAGE") || text.includes("MESSAGED")) return "reply";
  return notification.actionUrl ? "view" : "none";
}

function NotificationText({ notification }: { notification: NotificationResponse }) {
  return (
    <p className="notif-row-text">
      <strong>{notification.title}</strong>
      {notification.message && (
        <>
          <span> : </span>
          <span className="notif-message">{notification.message}</span>
        </>
      )}
      <time>{relativeTime(notification.createdAt)}</time>
    </p>
  );
}

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const loading = useAppSelector(selectNotifLoading);
  const totalPages = useAppSelector(selectNotifTotalPages);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    dispatch(fetchMyNotifications(0));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const sourceNotifications = notifications.length > 0 ? notifications : demoNotifications;
  const visibleNotifications = useMemo(
    () => sourceNotifications.filter((notification) => notificationMatchesTab(notification, activeTab)),
    [activeTab, sourceNotifications]
  );

  const thisWeek = visibleNotifications.filter((notification) => isThisWeek(notification.createdAt));
  const thisMonth = visibleNotifications.filter((notification) => !isThisWeek(notification.createdAt));

  const handleNotificationClick = (notification: NotificationResponse) => {
    if (!notification.id.startsWith("demo-") && !notification.read) {
      dispatch(markNotificationRead(notification.id));
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    dispatch(fetchMyNotifications(nextPage));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
  };

  const renderActions = (notification: NotificationResponse) => {
    const actionKind = getActionKind(notification);

    if (actionKind === "join") {
      return (
        <div className="notif-actions notif-actions-pair">
          <button type="button" className="notif-btn notif-btn-outline" onClick={() => handleNotificationClick(notification)}>
            Decline
          </button>
          <button type="button" className="notif-btn notif-btn-blue" onClick={() => handleNotificationClick(notification)}>
            Accept
          </button>
        </div>
      );
    }

    if (actionKind === "following") {
      return <button type="button" className="notif-btn notif-btn-plain">Following</button>;
    }

    if (actionKind === "follow") {
      return <button type="button" className="notif-btn notif-btn-blue" onClick={() => handleNotificationClick(notification)}>Follow Back</button>;
    }

    if (actionKind === "reply") {
      return <button type="button" className="notif-btn notif-btn-gradient" onClick={() => handleNotificationClick(notification)}>Reply</button>;
    }

    if (actionKind === "view") {
      return <button type="button" className="notif-btn notif-btn-blue" onClick={() => handleNotificationClick(notification)}>View</button>;
    }

    return null;
  };

  const renderSection = (title: string, items: NotificationResponse[]) => {
    if (items.length === 0) return null;

    return (
      <section className="notif-section">
        <h2>{title}</h2>
        <div className="notif-list">
          {items.map((notification) => (
            <article
              key={notification.id}
              className={["notif-row", !notification.read ? "notif-row-unread" : ""].join(" ")}
            >
              <button
                type="button"
                className="notif-row-main"
                onClick={() => handleNotificationClick(notification)}
              >
                <span className={avatarClass(notification)}>{initials(notification)}</span>
                <NotificationText notification={notification} />
              </button>
              {renderActions(notification)}
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="notif-page">
      <img className="notif-plane notif-plane-mid" src={flightDecoration} alt="" aria-hidden="true" />
      <span className="notif-outline-star notif-star-left" />
      <span className="notif-outline-star notif-star-right" />
      <span className="notif-outline-star notif-star-bottom" />

      <div className="notif-shell">
        <div className="notif-heading-row">
          <h1>League Updates</h1>
          <button type="button" className="notif-mark-read" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        </div>

        <div className="notif-tabs" role="tablist" aria-label="Notification filters">
          {TABS.map((tab) => {
            const count = countForTab(sourceNotifications, tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? "notif-tab notif-tab-active" : "notif-tab"}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}
        </div>

        {loading && notifications.length === 0 ? (
          <div className="notif-state">Loading updates...</div>
        ) : visibleNotifications.length === 0 ? (
          <div className="notif-state">No league updates here yet.</div>
        ) : (
          <>
            {renderSection("This week", thisWeek)}
            {thisWeek.length > 0 && thisMonth.length > 0 && <div className="notif-divider" />}
            {renderSection("This month", thisMonth)}
          </>
        )}

        {notifications.length > 0 && currentPage < totalPages - 1 && (
          <div className="notif-load-wrap">
            <button type="button" className="notif-btn notif-btn-gradient" disabled={loading} onClick={handleLoadMore}>
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
