import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

// Shared stroke defaults — colour & size come from the parent via `currentColor`
// and Tailwind width/height classes, so every icon stays themeable.
const strokeProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/* ── Sidebar nav icons ─────────────────────────────────── */

export const HomeIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M3 10.6 12 4l9 6.6" />
    <path d="M5.2 9.6V20h13.6V9.6" />
    <path d="M9.6 20v-5.4h4.8V20" />
  </svg>
);

// Filled "layout-dashboard" glyph — reads as solid blocks on the active red chip.
export const DashboardIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...p}>
    <rect x="3" y="3" width="8" height="8" rx="1.6" />
    <rect x="13" y="3" width="8" height="5" rx="1.6" />
    <rect x="13" y="10" width="8" height="11" rx="1.6" />
    <rect x="3" y="13" width="8" height="8" rx="1.6" />
  </svg>
);

export const CalendarIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <line x1="3" y1="9.2" x2="21" y2="9.2" />
    <line x1="8" y1="2.6" x2="8" y2="6" />
    <line x1="16" y1="2.6" x2="16" y2="6" />
    <circle cx="8" cy="13.3" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="13.3" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="13.3" r="1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="17" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const TeamsIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="3.6" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.3a4 4 0 0 1 0 7.4" />
  </svg>
);

export const RobotIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <rect x="4.5" y="8" width="15" height="10.5" rx="2.5" />
    <line x1="12" y1="4.6" x2="12" y2="8" />
    <circle cx="12" cy="3.6" r="1.1" />
    <circle cx="9" cy="13.2" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13.2" r="1.25" fill="currentColor" stroke="none" />
    <line x1="2.6" y1="12" x2="2.6" y2="14.8" />
    <line x1="21.4" y1="12" x2="21.4" y2="14.8" />
  </svg>
);

export const MatchesIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <line x1="5" y1="4" x2="16.5" y2="17.5" />
    <line x1="19" y1="4" x2="7.5" y2="17.5" />
    <line x1="15" y1="19" x2="18" y2="16" />
    <line x1="9" y1="19" x2="6" y2="16" />
  </svg>
);

export const RankingsIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <circle cx="12" cy="4.6" r="2" />
    <circle cx="5.5" cy="19.4" r="2" />
    <circle cx="18.5" cy="19.4" r="2" />
    <line x1="12" y1="6.6" x2="12" y2="13.5" />
    <line x1="5.5" y1="13.5" x2="18.5" y2="13.5" />
    <line x1="5.5" y1="13.5" x2="5.5" y2="17.4" />
    <line x1="18.5" y1="13.5" x2="18.5" y2="17.4" />
  </svg>
);

/* ── Utility / navbar icons ────────────────────────────── */

export const ChevronLeftIcon = ({ className = "h-5 w-5", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <polyline points="14.5 5 8 12 14.5 19" />
  </svg>
);

export const LogoutIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const BellIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 8-2.5 8h17S18 14.5 18 8.5" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

export const UserCircleIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3.2" />
    <path d="M6.6 18.2a6 6 0 0 1 10.8 0" />
  </svg>
);

export const SettingsGearIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const ChatIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const ReportsIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export const StarIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const AchievementIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <circle cx="12" cy="8" r="5" />
    <path d="M7 13.5 5 21l7-3 7 3-2-7.5" />
  </svg>
);

export const CertificateIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <line x1="7" y1="9" x2="17" y2="9" />
    <line x1="7" y1="13" x2="13" y2="13" />
    <circle cx="17" cy="17" r="3" />
    <path d="m19.5 19.5 2 2" />
  </svg>
);

export const SupportIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r=".5" fill="currentColor" stroke="none" />
  </svg>
);

export const VenueIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <rect x="9" y="14" width="6" height="7" />
    <rect x="8.5" y="10" width="3" height="3" />
    <rect x="12.5" y="10" width="3" height="3" />
  </svg>
);

export const ScheduleIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 16 14" />
  </svg>
);

export const BillingIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="9" y2="15" />
  </svg>
);

export const CommunicationIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.9 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.81 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.19 6.19l1.26-1.26a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const JudgeIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="m14 13-7.5 7.5a2.1 2.1 0 1 1-3-3L11 10" />
    <path d="m16 16 6-6" />
    <path d="m8 8 6-6" />
    <path d="m9 7 8 8" />
    <path d="m21 11-8-8" />
  </svg>
);

export const AnalyticsIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export const TicketIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <line x1="9" y1="12" x2="15" y2="12" strokeDasharray="2 2" />
  </svg>
);

export const AuditIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const SearchIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="16.5" y1="16.5" x2="22" y2="22" />
  </svg>
);

export const LiveIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M5.636 18.364a9 9 0 0 1 0-12.728" />
    <path d="M18.364 5.636a9 9 0 0 1 0 12.728" />
    <path d="M8.464 15.536a5 5 0 0 1 0-7.072" />
    <path d="M15.536 8.464a5 5 0 0 1 0 7.072" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const PartnersIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l1.71 1.71" />
    <path d="m14 14-2-2" />
    <path d="M7.5 13 3 8.7a2.86 2.86 0 0 1 3.5-4.5l3 3" />
    <path d="M6 14l2-2" />
    <path d="m8 16 1.5 1.5" />
  </svg>
);

export const SportsIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const ParticipantsIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const QuickActionsIcon = ({ className = "h-[30px] w-[30px]", ...p }: IconProps) => (
  <svg {...strokeProps} className={className} {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);