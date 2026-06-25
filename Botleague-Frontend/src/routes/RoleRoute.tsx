import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../app/store";
import type { AppRoleType } from "../shared/constants/roles";
import { hasRole } from "../shared/constants/roles";

interface RoleRouteProps {
  children: React.ReactNode;
  /** Minimum role required. Hierarchy is respected — SUPER_ADMIN passes any check. */
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
