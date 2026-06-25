// features/Dashboard/hooks/useDashboard.ts
import { useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  fetchDashboard,
  selectDashboardProfile,
  selectDashboardRobots,
  selectDashboardTeams,
  selectDashboardInvites,
  selectDashboardEvents,
  selectDashboardLoading,
  selectDashboardError,
} from "../store/dashboardSlice";

// We ONLY borrow `leaveTeam` from here — the invitation LIST now comes from the
// dashboard response itself (`invite` array), so we don't double-fetch it.
import useTeamInvitations from "../../Team/hooks/useTeamInvitations";

import type {
  ProfileDTO,
  RobotResponseDTO,
  TeamsDTO,
  InvitesDTO,
  EventDTO,
  MatchDTO,
} from "../api/userDashboard.api";

/* ──────────────────────────────────────────────────────────────────────────
   Why this hook had to change
   ────────────────────────────
   The OLD hook read stats off `state.auth.user` (eventsCount, wins,
   matchesCount, winRate, ranking, teamsCount, robotsBuilt …). The /dashboard
   endpoint NEVER sends those fields, so every stat rendered as 0 / "0%" / "—".

   The real /dashboard payload only gives us arrays (robots, teams, events →
   sport → matches) plus a thin profile. So ALL stats are now DERIVED from
   those arrays here. The auth user is used ONLY for things the dashboard
   genuinely doesn't return: avatar, username, email, country/address.
   ────────────────────────────────────────────────────────────────────────── */

const upper = (s?: string | null) => (s || "").toUpperCase();

function isExpired(iso?: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

/* The same event/sport can appear more than once in `events` (e.g. TechFest
   shows up as one CANCELLED registration with 0 matches AND one REGISTERED
   registration with 3 matches). Collapse by eventId+eventSportId, keeping the
   row that actually carries matches, then preferring a non-CANCELLED status. */
function dedupeEvents(events: EventDTO[]): EventDTO[] {
  const map = new Map<string, EventDTO>();
  for (const ev of events) {
    const key = `${ev.eventId}::${ev.sport?.eventSportId ?? ""}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, ev);
      continue;
    }
    const newMatches = ev.sport?.matches?.length ?? 0;
    const oldMatches = existing.sport?.matches?.length ?? 0;
    if (newMatches > oldMatches) {
      map.set(key, ev);
    } else if (newMatches === oldMatches) {
      const oldCancelled = upper(existing.sport?.registrationStatus) === "CANCELLED";
      const newCancelled = upper(ev.sport?.registrationStatus) === "CANCELLED";
      if (oldCancelled && !newCancelled) map.set(key, ev);
    }
  }
  return Array.from(map.values());
}

/* The dashboard doesn't tell us which registrationId belongs to the viewer.
   But the viewer plays in EVERY match of their own bracket, so their
   registration id is simply the one that appears in the most matches of that
   sport. This is robust even when BOTH sides of a match are the user's own
   teams. Returns null when there are no matches. */
function myRegistrationId(matches: MatchDTO[]): string | null {
  const tally = new Map<string, number>();
  for (const m of matches) {
    if (m.teamARegistrationId)
      tally.set(m.teamARegistrationId, (tally.get(m.teamARegistrationId) ?? 0) + 1);
    if (m.teamBRegistrationId)
      tally.set(m.teamBRegistrationId, (tally.get(m.teamBRegistrationId) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [id, count] of tally) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

/* ── view models exposed to the page ─────────────────────────────────────── */
export interface MatchView extends MatchDTO {
  mySide: "A" | "B" | null;
  outcome: "WIN" | "LOSS" | "PENDING";
}

export interface EventView extends EventDTO {
  myRegistrationId: string | null;
  matchViews: MatchView[];
}

export default function useDashboard() {
  const dispatch = useAppDispatch();

  // ── Dashboard API data (cast through unknown so this compiles regardless of
  //    how the slice currently types its selectors) ─────────────────────────
  const profile = useAppSelector(selectDashboardProfile) as unknown as ProfileDTO | null;
  const robots = (useAppSelector(selectDashboardRobots) as unknown as RobotResponseDTO[]) ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const apiTeams = (useAppSelector(selectDashboardTeams) as unknown as TeamsDTO[]) ?? [];
  const apiInvites = (useAppSelector(selectDashboardInvites) as unknown as InvitesDTO[]) ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rawEvents = (useAppSelector(selectDashboardEvents) as unknown as EventDTO[]) ?? [];
  const isLoading = useAppSelector(selectDashboardLoading) as unknown as boolean;
  const error = useAppSelector(selectDashboardError) as unknown as string | null;

  // ── Auth user — ONLY for fields /dashboard doesn't return ─────────────────
  const authUser = useAppSelector((state) => state.auth.user) as any;

  // ── leaveTeam mutation (invitation list intentionally NOT taken from here) ─
  const { leaveTeam } = useTeamInvitations();

  // ── Fetch on mount + manual refresh ───────────────────────────────────────
  const refresh = useCallback(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  // ── The team the user is CURRENTLY in (status ACTIVE). The sample user has
  //    3 memberships but 2 are LEFT, so only `detrox111111` is current. ──────
  const activeTeam = useMemo(
    () => apiTeams.find((t) => upper(t.status) === "ACTIVE") ?? null,
    [apiTeams]
  );

  // ── Events: dedupe, then attach per-match outcome from the viewer's POV ────
  const events: EventView[] = useMemo(() => {
    return dedupeEvents(rawEvents).map((ev) => {
      const matches = ev.sport?.matches ?? [];
      const myReg = myRegistrationId(matches);

      const matchViews: MatchView[] = matches.map((m) => {
        const mySide: MatchView["mySide"] =
          myReg && m.teamARegistrationId === myReg
            ? "A"
            : myReg && m.teamBRegistrationId === myReg
            ? "B"
            : null;

        let outcome: MatchView["outcome"] = "PENDING";
        if (upper(m.status) === "COMPLETED" && m.winnerRegistrationId) {
          outcome = myReg && m.winnerRegistrationId === myReg ? "WIN" : "LOSS";
        }

        return { ...m, mySide, outcome };
      });

      return { ...ev, myRegistrationId: myReg, matchViews };
    });
  }, [rawEvents]);

  // ── Flatten every match across every event for stat math ──────────────────
  const allMatchViews: MatchView[] = useMemo(
    () => events.flatMap((e) => e.matchViews),
    [events]
  );

  // ── Core derived stats ─────────────────────────────────────────────────────
  const wins = allMatchViews.filter((m) => m.outcome === "WIN").length;
  const losses = allMatchViews.filter((m) => m.outcome === "LOSS").length;
  const completed = wins + losses;
  const upcoming = allMatchViews.filter((m) => upper(m.status) === "SCHEDULED").length;
  const totalMatches = allMatchViews.length;
  const winRatePct = completed > 0 ? Math.round((wins / completed) * 100) : 0;

  // ── memberSince / yearsActive ─────────────────────────────────────────────
  const memberSince = profile?.memberSince ?? authUser?.createdAt ?? null;
  const joinedYear = memberSince ? new Date(memberSince).getFullYear() : null;
  const yearsActive = joinedYear ? Math.max(0, new Date().getFullYear() - joinedYear) : 0;

  // ── Merged user: auth-only fields + dashboard profile fields ──────────────
  const user = useMemo(
    () => ({
      // auth-only (NOT in /dashboard)
      profilePhotoUrl: authUser?.profilePhotoUrl ?? null,
      avatarUrl: authUser?.profilePhotoUrl ?? authUser?.avatarUrl ?? null,
      userName: authUser?.userName ?? null,
      email: authUser?.email ?? null,
      country: authUser?.country ?? null,
      address: authUser?.address ?? null,

      // from dashboard profile
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      botLeagueId: profile?.botLeagueId ?? null,
      location: profile?.location ?? authUser?.city ?? null,
      role: profile?.role ?? null,
      memberSince,
      rank: profile?.rank ?? null,
      seasonPoints: profile?.seasonPoints ?? null,

      // derived
      teamRole: activeTeam?.role ?? null,
    }),
    [authUser, profile, memberSince, activeTeam]
  );

  // ── Invitations: sourced from the dashboard `invite` array ────────────────
  //    (backend already filters to pending + non-expired, but we still split
  //     defensively so the UI behaves if that ever changes.)
  const invitations = apiInvites;
  const pendingInvites = invitations.filter(
    (inv) => upper(inv.status) === "PENDING" && !isExpired(inv.expiresAt)
  );
  const expiredPending = invitations.filter(
    (inv) => upper(inv.status) === "PENDING" && isExpired(inv.expiresAt)
  );
  const pastInvites = invitations.filter((inv) =>
    ["ACCEPTED", "DECLINED", "CANCELLED"].includes(upper(inv.status))
  );

  // ── Stats object consumed by the page ─────────────────────────────────────
  const stats = {
    eventsParticipated: events.length,
    matchesTotal: totalMatches,
    matchesPlayed: completed,
    matchesUpcoming: upcoming,
    wins,
    losses,
    winRate: completed > 0 ? `${winRatePct}%` : "—",
    winRateNum: winRatePct,
    ranking: profile?.rank != null ? `#${profile.rank}` : "—",
    rankNum: profile?.rank ?? 0,
    seasonPoints: profile?.seasonPoints ?? 0,
    teamsJoined: apiTeams.length,
    robotsBuilt: robots.length,
    yearsActive,
  };

  // ── Display flags ─────────────────────────────────────────────────────────
  const isReady = !isLoading && !error;
  const hasTeam = !!activeTeam;
  const hasInvites = pendingInvites.length > 0;
  const hasRobots = robots.length > 0;
  const hasEvents = events.length > 0;
  console.log("activeTeam", activeTeam);
  return {
    // merged user (auth + profile)
    user,

    // raw-ish API data
    profile,
    robots,
    teams: apiTeams,
    apiTeams,
    apiInvites,

    // enriched events + flattened matches
    events,
    allMatchViews,

    // current team (alias `team` kept for the page's existing references)
    activeTeam,
    team: activeTeam,
    teamRole: user.teamRole,
    joinedYear,

    // invitations
    invitations,
    pendingInvites,
    expiredPending,
    pastInvites,
    invitesLoading: isLoading,
    leaveTeam,

    // stats
    stats,

    // flags
    isLoading,
    isReady,
    error,
    hasTeam,
    hasInvites,
    hasRobots,
    hasEvents,

    // actions
    refresh,
  };
}