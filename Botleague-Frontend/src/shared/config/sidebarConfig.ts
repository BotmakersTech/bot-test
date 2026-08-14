import { AppRole } from "../constants/roles";
import type { AppRoleType } from "../constants/roles";

export interface NavItem {
  id: string;
  label: string;
  link: string;
  iconName: string;
  roles: AppRoleType[];
}

const SA   = AppRole.SUPER_ADMIN;
const ADM  = AppRole.ADMIN;
const ORGR = AppRole.ORGANISER;
const ORG  = AppRole.EVENT_HEAD;
const SUB  = AppRole.SPORT_HEAD;
const CMP  = AppRole.COMPETITOR;
const JDG  = AppRole.JUDGE;
const VOL  = AppRole.VOLUNTEER;

export const NAV_CONFIG: NavItem[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // SUPER_ADMIN  — full platform visibility
  // ══════════════════════════════════════════════════════════════════════════
  { id: "s-dash",     label: "Dashboard", link: "/super-admin-dashboard", iconName: "dashboard",  roles: [SA] },
  { id: "s-users",    label: "All Users",            link: "/admin/users",           iconName: "users",      roles: [SA] },
  { id: "s-teams",    label: "All Teams",            link: "/admin/teams",           iconName: "teams",      roles: [SA] },
  { id: "s-robots",   label: "All Robots",           link: "/admin/robots",          iconName: "robot",      roles: [SA] },
  { id: "s-judges",   label: "Judge Ecosystem",      link: "/admin/judges",          iconName: "judge",      roles: [SA] },
  { id: "s-events",   label: "All Events",           link: "/admin/user",            iconName: "calendar",   roles: [SA] },
  { id: "s-partners", label: "Sponsors & Partners",  link: "/admin/sponsors",        iconName: "partners",   roles: [SA] },
  { id: "s-reports",  label: "Reports",              link: "/admin/reports",         iconName: "reports",    roles: [SA] },
  { id: "s-audit",    label: "Audit Logs",           link: "/admin/audit-logs",      iconName: "audit",      roles: [SA] },
  { id: "s-catalog",  label: "League Catalog",       link: "/admin/catalog",         iconName: "sports",     roles: [SA] },
  { id: "s-news",     label: "News",                 link: "/admin/news",            iconName: "communication", roles: [SA] },
  { id: "s-messages", label: "Messages",             link: "/messages",              iconName: "chat",       roles: [SA] },

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN  — platform + user + event management + event operations
  // ══════════════════════════════════════════════════════════════════════════
  { id: "a-dash",     label: "Dashboard", link: "/admin-dashboard",        iconName: "dashboard",  roles: [ADM] },
  { id: "a-users",    label: "All Users",           link: "/admin/users",            iconName: "users",      roles: [ADM] },
  { id: "a-teams",    label: "All Teams",           link: "/admin/teams",            iconName: "teams",      roles: [ADM] },
  { id: "a-robots",   label: "All Robots",          link: "/admin/robots",           iconName: "robot",      roles: [ADM] },
  { id: "a-events",   label: "All Events",          link: "/admin/user",             iconName: "calendar",   roles: [ADM] },
  { id: "a-judges",   label: "Judges & Volunteers", link: "/admin/judges",           iconName: "judge",      roles: [ADM] },
  { id: "a-sponsors", label: "Sponsors",            link: "/admin/sponsors",         iconName: "star",       roles: [ADM] },
  { id: "a-news",     label: "News",                link: "/admin/news",             iconName: "communication", roles: [ADM] },
  { id: "a-audit",    label: "Audit Logs",          link: "/admin/audit-logs",       iconName: "audit",      roles: [ADM] },
  { id: "a-catalog",  label: "League Catalog",      link: "/admin/catalog",          iconName: "sports",     roles: [ADM] },

  // ══════════════════════════════════════════════════════════════════════════
  // ORGANISER — external partner, owns their events
  // ══════════════════════════════════════════════════════════════════════════
  { id: "og-dash",       label: "Dashboard",          link: "/organizer-dashboard",      iconName: "dashboard",     roles: [ORGR] },
  { id: "og-events",     label: "Event Management",   link: "/organizer/events",         iconName: "calendar",      roles: [ORGR] },
  { id: "og-create",     label: "Create Event",       link: "/organizer/events/create",  iconName: "calendar",      roles: [ORGR] },
  { id: "og-sports",     label: "All Sports",         link: "/organizer/sports",         iconName: "sports",        roles: [ORGR] },
  { id: "og-reg",        label: "Registrations",      link: "/organizer/registrations",  iconName: "users",         roles: [ORGR] },
  { id: "og-matches",    label: "Matches",            link: "/organizer/matches",        iconName: "matches",       roles: [ORGR] },
  { id: "og-sched",      label: "Schedule",           link: "/organizer/schedule",       iconName: "schedule",      roles: [ORGR] },
  { id: "og-monitor",    label: "Monitoring",         link: "/organizer/monitoring",     iconName: "analytics",     roles: [ORGR] },
  { id: "og-incidents",  label: "Incidents",          link: "/organizer/incidents",      iconName: "audit",         roles: [ORGR] },
  { id: "og-volunteers", label: "Volunteers",         link: "/organizer/volunteers",     iconName: "users",         roles: [ORGR] },
  { id: "og-judges",     label: "Judges",             link: "/organizer/judges",         iconName: "judge",         roles: [ORGR] },
  { id: "og-staff",      label: "Staff",              link: "/organizer/staff",          iconName: "teams",         roles: [ORGR] },
  { id: "og-venue",      label: "Venue & Logistics",  link: "/organizer/venue",          iconName: "venue",         roles: [ORGR] },
  { id: "og-comm",       label: "Communication",      link: "/organizer/communication",  iconName: "communication", roles: [ORGR] },
  { id: "og-announce",   label: "Announcements",      link: "/organizer/announcements",  iconName: "bell",          roles: [ORGR] },
  { id: "og-reports",    label: "Reports",            link: "/organizer/reports",        iconName: "reports",       roles: [ORGR] },
  { id: "og-analytics",  label: "Analytics",          link: "/organizer/analytics",      iconName: "analytics",     roles: [ORGR] },
  { id: "og-cert",       label: "Certificates",       link: "/organizer/certificates",   iconName: "certificate",   roles: [ORGR] },
  { id: "og-closure",    label: "Event Closure",      link: "/organizer/closure",        iconName: "audit",         roles: [ORGR] },
  { id: "og-notif",      label: "Notifications",      link: "/notifications",            iconName: "bell",          roles: [ORGR] },
  { id: "og-news",       label: "News",               link: "/news",                     iconName: "communication", roles: [ORGR] },
  { id: "og-messages",   label: "Messages",           link: "/messages",                 iconName: "chat",          roles: [ORGR] },
  { id: "og-settings",   label: "Settings",           link: "/organizer/settings",       iconName: "settings",      roles: [ORGR] },

  // ══════════════════════════════════════════════════════════════════════════
  // EVENT_HEAD  — assigned event management
  // ══════════════════════════════════════════════════════════════════════════
  { id: "o-dash",       label: "Dashboard",          link: "/organizer-dashboard",      iconName: "dashboard",     roles: [ORG] },
  { id: "o-events",     label: "Event Management",   link: "/organizer/events",         iconName: "calendar",      roles: [ORG] },
  { id: "o-create",     label: "Create Event",       link: "/organizer/events/create",  iconName: "calendar",      roles: [ORG] },
  { id: "o-sports",     label: "All Sports",         link: "/organizer/sports",         iconName: "sports",        roles: [ORG] },
  { id: "o-reg",        label: "Registrations",      link: "/organizer/registrations",  iconName: "users",         roles: [ORG] },
  { id: "o-matches",    label: "Matches",            link: "/organizer/matches",        iconName: "matches",       roles: [ORG] },
  { id: "o-sched",      label: "Schedule",           link: "/organizer/schedule",       iconName: "schedule",      roles: [ORG] },
  { id: "o-monitor",    label: "Monitoring",         link: "/organizer/monitoring",     iconName: "analytics",     roles: [ORG] },
  { id: "o-incidents",  label: "Incidents",          link: "/organizer/incidents",      iconName: "audit",         roles: [ORG] },
  { id: "o-volunteers", label: "Volunteers",         link: "/organizer/volunteers",     iconName: "users",         roles: [ORG] },
  { id: "o-judges",     label: "Judges",             link: "/organizer/judges",         iconName: "judge",         roles: [ORG] },
  { id: "o-staff",      label: "Staff",              link: "/organizer/staff",          iconName: "teams",         roles: [ORG] },
  { id: "o-venue",      label: "Venue & Logistics",  link: "/organizer/venue",          iconName: "venue",         roles: [ORG] },
  { id: "o-comm",       label: "Communication",      link: "/organizer/communication",  iconName: "communication", roles: [ORG] },
  { id: "o-announce",   label: "Announcements",      link: "/organizer/announcements",  iconName: "bell",          roles: [ORG] },
  { id: "o-reports",    label: "Reports",            link: "/organizer/reports",        iconName: "reports",       roles: [ORG] },
  { id: "o-analytics",  label: "Analytics",          link: "/organizer/analytics",      iconName: "analytics",     roles: [ORG] },
  { id: "o-cert",       label: "Certificates",       link: "/organizer/certificates",   iconName: "certificate",   roles: [ORG] },
  { id: "o-closure",    label: "Event Closure",      link: "/organizer/closure",        iconName: "audit",         roles: [ORG] },
  { id: "o-notif",      label: "Notifications",      link: "/notifications",            iconName: "bell",          roles: [ORG] },
  { id: "o-news",       label: "News",               link: "/news",                     iconName: "communication", roles: [ORG] },
  { id: "o-messages",   label: "Messages",           link: "/messages",                 iconName: "chat",          roles: [ORG] },
  { id: "o-settings",   label: "Settings",           link: "/organizer/settings",       iconName: "settings",      roles: [ORG] },

  // ══════════════════════════════════════════════════════════════════════════
  // SPORT_HEAD  — sport-level management within an event
  // ══════════════════════════════════════════════════════════════════════════
  { id: "sub-dash",    label: "Dashboard",           link: "/organizer-dashboard",      iconName: "dashboard",  roles: [SUB] },
  { id: "sub-sports",  label: "My Sports",           link: "/organizer/my-sports",      iconName: "sports",     roles: [SUB] },
  { id: "sub-reg",     label: "Registrations",       link: "/organizer/registrations",  iconName: "users",      roles: [SUB] },
  { id: "sub-matches", label: "Matches",             link: "/organizer/matches",        iconName: "matches",    roles: [SUB] },
  { id: "sub-scores",  label: "Scores",              link: "/organizer/scores",         iconName: "rankings",   roles: [SUB] },
  { id: "sub-ann",     label: "Announcements",       link: "/organizer/announcements",  iconName: "bell",       roles: [SUB] },
  { id: "sub-sched",   label: "Schedule",            link: "/organizer/schedule",       iconName: "schedule",   roles: [SUB] },
  { id: "sub-notif",   label: "Notifications",       link: "/notifications",            iconName: "bell",       roles: [SUB] },
  { id: "sub-news",    label: "News",                link: "/news",                     iconName: "communication", roles: [SUB] },
  { id: "sub-messages",label: "Messages",            link: "/messages",                 iconName: "chat",       roles: [SUB] },

  // ══════════════════════════════════════════════════════════════════════════
  // COMPETITOR  — regular platform user / competitor
  // ══════════════════════════════════════════════════════════════════════════
  { id: "c-dash",     label: "Dashboard",    link: "/user-dashboard",  iconName: "dashboard",   roles: [CMP] },
  { id: "c-team",     label: "My Team",      link: "/my-team",         iconName: "teams",       roles: [CMP] },
  { id: "c-robots",   label: "My Robots",    link: "/robots",          iconName: "robot",       roles: [CMP] },
  { id: "c-events",   label: "Events",       link: "/browse-events",   iconName: "calendar",    roles: [CMP] },
  { id: "c-rank",     label: "Rankings",     link: "/rankings",        iconName: "rankings",    roles: [CMP] },
  { id: "c-cert",     label: "Certificates", link: "/certificates",    iconName: "certificate", roles: [CMP] },
  { id: "c-news",     label: "News",         link: "/news",            iconName: "communication", roles: [CMP] },
  { id: "c-support",  label: "Support",      link: "/support",         iconName: "support",     roles: [CMP] },

  // ══════════════════════════════════════════════════════════════════════════
  // JUDGE  — views + scores assigned matches
  // ══════════════════════════════════════════════════════════════════════════
  { id: "j-dash",    label: "Dashboard",        link: "/judge-dashboard",      iconName: "dashboard", roles: [JDG] },
  { id: "j-matches", label: "Assigned Matches", link: "/judge/matches",        iconName: "matches",   roles: [JDG] },
  { id: "j-scores",  label: "Score Entry",      link: "/judge/scores",         iconName: "rankings",  roles: [JDG] },
  { id: "j-cert",    label: "Certificates",     link: "/certificates",         iconName: "certificate", roles: [JDG] },
  { id: "j-notif",   label: "Notifications",    link: "/notifications",        iconName: "bell",      roles: [JDG] },
  { id: "j-news",    label: "News",             link: "/news",                 iconName: "communication", roles: [JDG] },

  // ══════════════════════════════════════════════════════════════════════════
  // VOLUNTEER  — views event info, checks in/out
  // ══════════════════════════════════════════════════════════════════════════
  { id: "v-dash",    label: "Dashboard",        link: "/volunteer-dashboard",  iconName: "dashboard", roles: [VOL] },
  { id: "v-event",   label: "My Event",         link: "/volunteer/event",      iconName: "calendar",  roles: [VOL] },
  { id: "v-cert",    label: "Certificates",     link: "/certificates",         iconName: "certificate", roles: [VOL] },
  { id: "v-notif",   label: "Notifications",    link: "/notifications",        iconName: "bell",      roles: [VOL] },
  { id: "v-news",    label: "News",             link: "/news",                 iconName: "communication", roles: [VOL] },
];

// ── Role priority for primary-role resolution ────────────────────────────────
const ROLE_PRIORITY: AppRoleType[] = [SA, ADM, ORGR, ORG, SUB, JDG, VOL, CMP];

export function getPrimaryRole(userRoles: string[]): AppRoleType {
  return ROLE_PRIORITY.find(r => userRoles.includes(r)) ?? CMP;
}

export function getNavItemsForRoles(userRoles: string[]): NavItem[] {
  const primary = getPrimaryRole(userRoles);
  return NAV_CONFIG.filter(item => item.roles.includes(primary));
}

/** How many of a role's nav items ride directly in the mobile bottom bar
 * (MobileBottomNav) before the rest move into the top navbar's overflow
 * menu (MobileMoreMenu) — each role's list is already ordered by
 * frequency/importance, so this is just "the first N". */
export const MOBILE_NAV_VISIBLE_COUNT = 5;
