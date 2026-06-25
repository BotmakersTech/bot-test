import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getProfile,
  updateProfile,
  updateUsername,
  updateEmail,
  checkEmailVerified,
} from "../api/profile.api";

import { getMyTeam } from "../../Team/api/team.api";
import { uploadProfileImage } from "../api/upload.api";

import {
  getTeamMemberships,
  
} from "../../UserDashboard/api/userMembership.api";

import {
  useAppDispatch,
  useAppSelector,
} from "../../../app/hooks";

import {
  setTeam as setReduxTeam,
  clearTeam,
} from "../../Team/store/TeamSlice";

import {
  membershipFetchStart,
  setMemberships,
  membershipFetchFailure,
  clearMemberships,
  type TeamMembershipState,
} from "../../Team/TeamMembership/store/TeamMembership.slice";

// ─────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────

const DEFAULT_TEAM_NAME = "User not joined to a team yet";
const RESEND_COOLDOWN_MS = 60_000;
const EMAIL_POLL_INTERVAL_MS = 10_000;

// ─────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────

export interface ProfileResponse {
  id?: string;
  botleagueId?: string;
  email?: string | null;
  pendingEmail?: string | null;
  phone?: string;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  dateOfBirth?: string;
  teamName?: string;
  profilePhotoUrl?: string;
  teamMembership?: string;
  leadTeamMembership?: boolean;
}

export type LoadingKey =
  | "profile"
  | "team"
  | "membership"
  | "avatar"
  | "username"
  | "profileUpdate"
  | "emailSend"
  | "emailPoll";

export interface ProfileErrors {
  global?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface UseProfileReturn {
  saveSuccess: boolean | undefined;
  profile: ProfileResponse | null;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  pendingEmailInput: string;
  setPendingEmailInput: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  botleagueId: string;
  teamName: string;
  memberships: TeamMembershipState[];
  pendingEmail: string | null;
  resendCooldownSeconds: number;
  isPollingEmailVerification: boolean;
  profilePhotoUrl: string | null;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isEditingUsername: boolean;
  setIsEditingUsername: (v: boolean) => void;
  isEditingName: boolean;
  setIsEditingName: (v: boolean) => void;
  isEditingEmail: boolean;
  setIsEditingEmail: (v: boolean) => void;
  saveUsername: () => Promise<void>;
  handleUpdate: () => Promise<void>;
  saveEmail: () => Promise<void>;
  refetch: () => Promise<void>;
  loadingKeys: Set<LoadingKey>;
  isLoading: boolean;
  errors: ProfileErrors;
  clearError: (field?: keyof ProfileErrors) => void;
}

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// ─────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────

export default function useProfile(): UseProfileReturn {

  const dispatch = useAppDispatch();

  // ───────────────────────────────────────────────────
  // UNMOUNT GUARD
  // ───────────────────────────────────────────────────

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ───────────────────────────────────────────────────
  // LOADING
  // ───────────────────────────────────────────────────

  const [loadingKeys, setLoadingKeys] = useState<Set<LoadingKey>>(new Set());

  const startLoading = useCallback((key: LoadingKey) => {
    setLoadingKeys((prev) => new Set(prev).add(key));
  }, []);

  const stopLoading = useCallback((key: LoadingKey) => {
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  // ───────────────────────────────────────────────────
  // ERRORS
  // ───────────────────────────────────────────────────

  const [errors, setErrors] = useState<ProfileErrors>({});

  const setError = useCallback((field: keyof ProfileErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field?: keyof ProfileErrors) => {
    if (field) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } else {
      setErrors({});
    }
  }, []);

  // ───────────────────────────────────────────────────
  // PROFILE STATE
  // ───────────────────────────────────────────────────

  const [profile, setProfile]         = useState<ProfileResponse | null>(null);
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [username, setUsername]       = useState("");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [city, setCity]               = useState("");
  const [state, setState]             = useState("");
  const [country, setCountry]         = useState("");
  const [address, setAddress]         = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [botleagueId, setBotleagueId] = useState("");
  const [teamName, setTeamName]       = useState(DEFAULT_TEAM_NAME);
  const [avatarSrc, setAvatarSrc]     = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean | undefined>(undefined);

  // ───────────────────────────────────────────────────
  // EMAIL STATE
  // ───────────────────────────────────────────────────

  const [pendingEmailInput, setPendingEmailInput] = useState("");
  const [pendingEmail, setPendingEmail]           = useState<string | null>(null);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);

  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPollingEmailVerification, setIsPollingEmailVerification] = useState(false);

  // ───────────────────────────────────────────────────
  // EDIT STATES
  // ───────────────────────────────────────────────────

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingName, setIsEditingName]         = useState(false);
  const [isEditingEmail, setIsEditingEmail]       = useState(false);

  // ───────────────────────────────────────────────────
  // MEMBERSHIPS — read from Redux store.
  // MyTeams.tsx owns the useTeam() + useTeamRole() logic;
  // useProfile only needs the flat list for the profile page.
  // ───────────────────────────────────────────────────

  const memberships = useAppSelector(
    (state) => state.teamMembership.memberships
  );

  // ───────────────────────────────────────────────────
  // COOLDOWN
  // ───────────────────────────────────────────────────

  const startResendCooldown = useCallback(() => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);

    const totalSeconds = Math.floor(RESEND_COOLDOWN_MS / 1000);
    setResendCooldownSeconds(totalSeconds);

    cooldownTimerRef.current = setInterval(() => {
      setResendCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current!);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ───────────────────────────────────────────────────
  // EMAIL POLL
  // ───────────────────────────────────────────────────

  const stopEmailPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsPollingEmailVerification(false);
  }, []);

  const hydrateProfileState = useCallback((data: ProfileResponse) => {
    setProfile(data);
    setFirstName(data.firstName ?? "");
    setLastName(data.lastName ?? "");
    setPhone(data.phone ?? "");
    setEmail(data.email ?? "");
    setUsername(data.userName ?? "");
    setBotleagueId(data.botleagueId ?? "");
    setAvatarSrc(data.profilePhotoUrl ?? null);
    setCity((data.city ?? "").trim());
    setState((data.state ?? "").trim());
    setCountry((data.country ?? "").trim());
    setAddress(data.address ?? "");
    setDateOfBirth(data.dateOfBirth ?? "");
    if (data.pendingEmail) {
      setPendingEmail(data.pendingEmail);
    }
  }, []);

  const startEmailPoll = useCallback(() => {
    if (pollTimerRef.current) return;

    setIsPollingEmailVerification(true);

    pollTimerRef.current = setInterval(async () => {
      try {
        startLoading("emailPoll");
        const result = await checkEmailVerified();

        if (!isMountedRef.current) return;

        if (result.verified) {
          setEmail(result.email ?? "");
          setPendingEmail(null);
          setPendingEmailInput("");
          setIsEditingEmail(false);
          stopEmailPoll();

          const data = await getProfile();
          hydrateProfileState(data);
        }
      } finally {
        stopLoading("emailPoll");
      }
    }, EMAIL_POLL_INTERVAL_MS);
  }, [hydrateProfileState, startLoading, stopLoading, stopEmailPoll]);

  // ───────────────────────────────────────────────────
  // PROFILE
  // ───────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    startLoading("profile");
    clearError();
    try {
      const data = await getProfile();
      if (!isMountedRef.current) return;
      hydrateProfileState(data);
    } catch {
      setError("global", "Failed to load profile.");
    } finally {
      stopLoading("profile");
    }
  }, [clearError, hydrateProfileState, setError, startLoading, stopLoading]);

  // ───────────────────────────────────────────────────
  // TEAM
  // Dispatches to Redux so MyTeams.tsx / useTeam() picks
  // it up from the store — no duplication of role logic.
  // ───────────────────────────────────────────────────

  const loadTeam = useCallback(async () => {
    startLoading("team");
    try {
      const data = await getMyTeam();
      if (!isMountedRef.current) return null;

      setTeamName(data.teamName ?? DEFAULT_TEAM_NAME);

      dispatch(
        setReduxTeam({
          id:              data.id              ?? null,
          teamCode:        data.teamCode        ?? null,
          teamName:        data.teamName        ?? null,
          description:     data.description     ?? null,
          logoUrl:         data.logoUrl         ?? null,
          institutionName: data.institutionName ?? null,
          city:            data.city            ?? null,
          state:           data.state           ?? null,
          country:         data.country         ?? null,
        })
      );

      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        dispatch(clearTeam());
        setTeamName(DEFAULT_TEAM_NAME);
      } else {
        setError("global", "Failed to load team.");
      }
      return null;
    } finally {
      stopLoading("team");
    }
  }, [dispatch, setError, startLoading, stopLoading]);

  // ───────────────────────────────────────────────────
  // MEMBERSHIPS
  // Normalises the API response and dispatches to Redux
  // so MyTeams.tsx reads memberships from the same store
  // slice — no separate fetch needed there.
  // ───────────────────────────────────────────────────

const loadTeamMembership = useCallback(async (teamCode: string) => {
  dispatch(membershipFetchStart());
  startLoading("membership");

  try {
    const response = await getTeamMemberships(teamCode);
    // response is TeamMembershipsApiResponse[] — index in to get the first item
    const members = response[0]?.members ?? [];

    if (!isMountedRef.current) return;

    const normalised: TeamMembershipState[] = members.map((member) => ({
      id:           member.membershipId ?? member.teamMemberId ?? member.userId ?? "",
      userId:       member.userId       ?? "",
      joinedAt:     "",
      role:         member.teamRole     ?? "",
      status:       "ACTIVE",
      userName:     member.userName     ?? "",
      userCode:     member.userCode     ?? "",
      teamRole:     member.teamRole     ?? "",
      teamId:       "",
      isActive:     true,
      teamMemberId: member.membershipId ?? member.teamMemberId ?? member.userId ?? "",
    }));

    dispatch(setMemberships(normalised));
  } catch (err: any) {
    if (err?.response?.status === 404) {
      dispatch(clearMemberships());
    } else {
      const message =
        err?.response?.data?.message ?? "Failed to load team membership.";
      dispatch(membershipFetchFailure(message));
      setError("global", message);
    }
  } finally {
    stopLoading("membership");
  }
}, [dispatch, setError, startLoading, stopLoading]);

  // ───────────────────────────────────────────────────
  // INITIAL LOAD
  // ───────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      await loadProfile();
      const teamData = await loadTeam();
      if (teamData?.teamCode) {
        await loadTeamMembership(teamData.teamCode);
      }
    })();
  }, []);

  useEffect(() => {
    if (pendingEmail && !pollTimerRef.current) {
      startEmailPoll();
    }
  }, [pendingEmail, startEmailPoll]);

  // ───────────────────────────────────────────────────
  // AVATAR
  // ───────────────────────────────────────────────────

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      setAvatarSrc(previewUrl);
      startLoading("avatar");

      try {
        const { fileUrl } = await uploadProfileImage(file);
        setAvatarSrc(fileUrl);
        await loadProfile();
      } finally {
        URL.revokeObjectURL(previewUrl);
        stopLoading("avatar");
      }
    },
    [loadProfile, startLoading, stopLoading]
  );

  // ───────────────────────────────────────────────────
  // USERNAME
  // ───────────────────────────────────────────────────

  const saveUsername = useCallback(async () => {
    if (!username.trim()) {
      setError("username", "Username cannot be empty.");
      return;
    }
    startLoading("username");
    try {
      await updateUsername(username.trim());
      setIsEditingUsername(false);
      await loadProfile();
    } catch (err: any) {
      setError(
        "username",
        err?.response?.data?.message ?? "Username update failed."
      );
    } finally {
      stopLoading("username");
    }
  }, [loadProfile, setError, startLoading, stopLoading, username]);

  // ───────────────────────────────────────────────────
  // UPDATE PROFILE
  // ───────────────────────────────────────────────────

  const handleUpdate = useCallback(async () => {
    startLoading("profileUpdate");
    try {
      await updateProfile({
        firstName:   firstName.trim(),
        lastName:    lastName.trim(),
        dateOfBirth: dateOfBirth || undefined,
        city:        city.trim(),
        state:       state.trim(),
        country:     country.trim(),
        address:     address.trim(),
      });
      setIsEditingName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      await loadProfile();
    } catch (err: any) {
      setSaveSuccess(false);
      setError(
        "global",
        err?.response?.data?.message ?? "Profile update failed."
      );
    } finally {
      stopLoading("profileUpdate");
    }
  }, [
    address, city, country, dateOfBirth,
    firstName, lastName,
    loadProfile, setError, startLoading, state, stopLoading,
  ]);

  // ───────────────────────────────────────────────────
  // EMAIL
  // ───────────────────────────────────────────────────

  const saveEmail = useCallback(async () => {
    const trimmed = pendingEmailInput.trim();
    if (!isValidEmail(trimmed)) {
      setError("email", "Invalid email.");
      return;
    }
    startLoading("emailSend");
    try {
      await updateEmail(trimmed);
      setPendingEmail(trimmed);
      setIsEditingEmail(false);
      startResendCooldown();
      startEmailPoll();
    } catch (err: any) {
      setError(
        "email",
        err?.response?.data?.message ?? "Failed to send verification email."
      );
    } finally {
      stopLoading("emailSend");
    }
  }, [
    pendingEmailInput,
    setError, startEmailPoll,
    startLoading, startResendCooldown, stopLoading,
  ]);

  // ───────────────────────────────────────────────────
  // REFETCH
  // ───────────────────────────────────────────────────

  const refetch = useCallback(async () => {
    await loadProfile();
    const teamData = await loadTeam();
    if (teamData?.teamCode) {
      await loadTeamMembership(teamData.teamCode);
    }
  }, [loadProfile, loadTeam, loadTeamMembership]);

  // ───────────────────────────────────────────────────
  // RETURN
  // ───────────────────────────────────────────────────

  return {
    saveSuccess,
    profile,
    firstName,   setFirstName,
    lastName,    setLastName,
    email,
    pendingEmailInput, setPendingEmailInput,
    phone,       setPhone,
    city,        setCity,
    state,       setState,
    country,     setCountry,
    address,     setAddress,
    dateOfBirth, setDateOfBirth,
    username,    setUsername,
    botleagueId,
    teamName,
    memberships,
    pendingEmail,
    resendCooldownSeconds,
    isPollingEmailVerification,
    profilePhotoUrl: avatarSrc,
    handleAvatarChange,
    isEditingUsername, setIsEditingUsername,
    isEditingName,     setIsEditingName,
    isEditingEmail,    setIsEditingEmail,
    saveUsername,
    handleUpdate,
    saveEmail,
    refetch,
    loadingKeys,
    isLoading: loadingKeys.size > 0,
    errors,
    clearError,
  };
}