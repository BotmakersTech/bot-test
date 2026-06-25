/**
 * BotLeague Role System — NO hierarchy.
 *
 * Every role has its own explicit permission set.
 * SUPER_ADMIN is listed explicitly on every admin endpoint;
 * no role automatically inherits another role's permissions.
 *
 * Role Descriptions:
 *   SUPER_ADMIN    — unrestricted platform access
 *   ADMINISTRATOR  — user mgmt, event creation, tier & sport-spec changes
 *   MANAGER        — event operations, registrations, matches, reports
 *   ORGANIZER      — manages their assigned events (info, people, venue)
 *   SUB_ORGANIZER  — manages their assigned sport within an event
 *   COMPETITOR     — regular platform user who competes
 *   JUDGE          — views + scores their assigned matches
 *   VOLUNTEER      — views event info, checks in/out
 */

export const AppRole = {
  SUPER_ADMIN:   "SUPER_ADMIN",
  ADMINISTRATOR: "ADMINISTRATOR",
  MANAGER:       "MANAGER",
  ORGANIZER:     "ORGANIZER",
  SUB_ORGANIZER: "SUB_ORGANIZER",
  COMPETITOR:    "COMPETITOR",
  JUDGE:         "JUDGE",
  VOLUNTEER:     "VOLUNTEER",
} as const;

export type AppRoleType = typeof AppRole[keyof typeof AppRole];

/**
 * Returns the user's effective roles — only the roles they actually have.
 * No hierarchy expansion.
 */
export function getEffectiveRoles(userRoles: string[]): string[] {
  return userRoles;
}

/**
 * Returns true if the user holds at least one of the required roles.
 * Exact match — no inheritance.
 */
export function hasRole(userRoles: string[], requiredRoles: AppRoleType[]): boolean {
  return requiredRoles.some(r => userRoles.includes(r));
}

// ── Convenience role sets ────────────────────────────────────────────────────

/** Platform administrators — user mgmt, event creation, tier changes */
export const ADMIN_AND_UP: AppRoleType[] = [
  AppRole.SUPER_ADMIN, AppRole.ADMINISTRATOR,
];

/** Roles with event-level management access */
export const MANAGER_AND_UP: AppRoleType[] = [
  AppRole.SUPER_ADMIN, AppRole.ADMINISTRATOR, AppRole.MANAGER,
];

/** Roles with organiser portal access */
export const ORG_ROLES: AppRoleType[] = [
  AppRole.SUPER_ADMIN, AppRole.ADMINISTRATOR, AppRole.MANAGER, AppRole.ORGANIZER,
];

/** Roles with sub-organiser sport-level access */
export const SUB_ORG_ROLES: AppRoleType[] = [
  AppRole.SUPER_ADMIN, AppRole.ADMINISTRATOR, AppRole.MANAGER,
  AppRole.ORGANIZER, AppRole.SUB_ORGANIZER,
];

/** Roles that can score matches */
export const SCORING_ROLES: AppRoleType[] = [
  AppRole.SUPER_ADMIN, AppRole.ADMINISTRATOR, AppRole.MANAGER,
  AppRole.ORGANIZER, AppRole.SUB_ORGANIZER, AppRole.JUDGE,
];

// Legacy aliases — keep for backward compatibility with existing route guards
export const ADMIN_MIN = MANAGER_AND_UP;
export const ORG_MIN   = ORG_ROLES;
