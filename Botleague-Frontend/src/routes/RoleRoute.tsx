import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../app/store";
import type { AppRoleType } from "../shared/constants/roles";
import { hasRole } from "../shared/constants/roles";

interface RoleRouteProps {
  children: React.ReactNode;
  /**
   * Roles allowed to view this route. BotLeague's role model is FLAT — there is
   * no automatic hierarchy, on the frontend or the backend (see shared/constants/roles.ts).
   * The user needs at least one role that literally appears in this list; a
   * SUPER_ADMIN account does NOT get in unless SUPER_ADMIN is included here.
   * Use one of the ADMIN_AND_UP / ORG_MIN / SUB_ORG_ROLES sets (which already
   * enumerate every higher role) rather than a single role, unless the route
   * really is meant to be exclusive to one role (e.g. Judge/Volunteer portals).
   */
  roles: AppRoleType[];
  redirectTo?: string;
}

export default function RoleRoute({ children, roles, redirectTo = "/user-dashboard" }: RoleRouteProps) {
  const { user, isAuthenticated, isAuthChecked } = useSelector((state: RootState) => state.auth);

  if (!isAuthChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = user?.allRoles ?? (user?.role ? [user.role] : []);
  if (!hasRole(userRoles, roles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
