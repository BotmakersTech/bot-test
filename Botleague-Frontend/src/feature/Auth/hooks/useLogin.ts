import { useState } from "react";
import { login as loginApi, getCurrentUser } from "../api/auth.api";
import { getProfile } from "../../Profile/api/profile.api";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess, loginFailure } from "../store/authSlice";
import { AppRole } from "../../../shared/constants/roles";
import { getPrimaryRole } from "../../../shared/config/sidebarConfig";

const ROLE_HOME: Record<string, string> = {
  [AppRole.SUPER_ADMIN]: "/super-admin-dashboard",
  [AppRole.ADMIN]:       "/admin-dashboard",
  [AppRole.ORGANISER]:   "/organizer-dashboard",
  [AppRole.EVENT_HEAD]:  "/organizer-dashboard",
  [AppRole.SPORT_HEAD]:  "/organizer-dashboard",
  [AppRole.COMPETITOR]:  "/user-dashboard",
};

export default function useLogin() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✅ VALIDATION
    if (mobile.length !== 10) {
      setError("Enter valid mobile number");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      setIsLoading(true);

      // 🔥 Step 1: login (sets cookie)
      await loginApi({
        identifier: mobile,
        password,
        loginType: "PHONE",
      });

      // Step 2: fetch profile + role data AFTER cookie is set
      const [profile, me] = await Promise.all([getProfile(), getCurrentUser()]);

      // 🔥 Step 3: update Redux — merge profile with role/allRoles from /auth/me
      dispatch(loginSuccess({
        ...profile,
        role: me.role,
        allRoles: me.allRoles,
        assignedEventIds: me.assignedEventIds,
        assignedSportIds: me.assignedSportIds,
      }));

      // 🔥 Step 4: navigate to the right dashboard for this role
      const allRoles = me.allRoles ?? (me.role ? [me.role] : []);
      const primary = getPrimaryRole(allRoles);
      navigate(ROLE_HOME[primary] ?? "/user-dashboard", { replace: true });

    } catch (err: unknown) {
      const errorData = (err as any)?.response?.data;

      dispatch(loginFailure());

      setError(
        errorData?.message ||
        errorData?.error ||
        "Login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mobile,
    setMobile,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
  };
}