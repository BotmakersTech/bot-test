/**
 * BotLeague Role System — NO hierarchy.
 *
 * Every role has its own explicit permission set.
 * SUPER_ADMIN is listed explicitly on every admin endpoint;
 * no role automatically inherits another role's permissions.
 *
 * Role Descriptions:
 *   SUPER_ADMIN  — unrestricted platform access
 *   ADMIN        — user mgmt, event creation, tier & sport-spec changes, event operations
 *   ORGANISER    — external partner who owns their events
 *   EVENT_HEAD   — manages their assigned events (info, people, venue)
 *   SPORT_HEAD   — manages their assigned sport within an event
 *   COMPETITOR   — regular platform user who competes
 *   JUDGE        — views + scores their assigned matches
 *   VOLUNTEER    — views event info, checks in/out
 */

export const AppRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN:       "ADMIN",
  ORGANISER:   "ORGANISER",
  EVENT_HEAD:  "EVENT_HEAD",
  SPORT_HEAD:  "SPORT_HEAD",
  COMPETITOR:  "COMPETITOR",
  JUDGE:       "JUDGE",
  VOLUNTEER:   "VOLUNTEER",
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

/** Platform administrators — user mgmt, event creation, tier & sport-spec changes, event operations */
export const ADMIN_AND_UP: AppRoleType[] = [AppRole.SUPER_ADMIN, AppRole.ADMIN];

/** Roles with organiser portal access — external partners who own their events, and up */
export const ORGANISER_AND_UP: AppRoleType[] = [...ADMIN_AND_UP, AppRole.ORGANISER];

/** Roles with event-head-level management access */
export const EVENT_HEAD_AND_UP: AppRoleType[] = [...ORGANISER_AND_UP, AppRole.EVENT_HEAD];

/** Roles with sport-head sport-level access */
export const SPORT_HEAD_AND_UP: AppRoleType[] = [...EVENT_HEAD_AND_UP, AppRole.SPORT_HEAD];

/** Roles that can score matches */
export const SCORING_ROLES: AppRoleType[] = [...SPORT_HEAD_AND_UP, AppRole.JUDGE];
