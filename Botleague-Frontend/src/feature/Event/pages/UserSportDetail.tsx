// ======================================================
// UserSportDetail.tsx
// Public Sport Detail Page — Route: /events/:eventId/sports/:sportId
// ======================================================

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { useEvent } from "../hook/useEvent";
import {
  getLineup,
  addLineupMember,
  removeLineupMember,
  registerTeamWithLineup,
  getSportSupportContacts,
} from "../api/event.api";
import type {
  EventResponse,
  EventSportResponse,
  EventRegistrationResponse,
  TeamLineUpResponse,
  LineupRole,
  SupportContact,
} from "../api/event.api";
import useMatches from "../../Matches/Hooks/useMatches";
import { useSportMatchRealtime } from "../../../shared/realtime/useMatchRealtime";
import useLeaderboard from "../../Leaderboard/hook/useLeaderboard";
import { useEligibility } from "../../Eligibility/hooks/useEligibility";
import "../../../styles/eventDetail.css";

import Hero from "../components/detail/Hero";
import SportDetailsHeader from "../components/detail/SportDetailsHeader";
import TournamentTabs from "../components/detail/TournamentTabs";
import MatchesTab from "../components/detail/MatchesTab";
import LeaderboardTab from "../components/detail/LeaderboardTab";
import ScheduleTab from "../components/detail/ScheduleTab";
import RegistrationTab from "../components/detail/RegistrationTab";
import LineupTab from "../components/detail/LineupTab";

function regId(r: EventRegistrationResponse): string {
  return r.registrationId ?? r.id ?? "";
}

export default function UserSportDetail() {
  const { eventId, sportId } = useParams<{ eventId: string; sportId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const {
    events, eventSports, registrations, loading, error,
    teamId, teamCode,
    teamMembers, isCaptain,
    fetchLiveEvents, fetchEventSports, fetchTeamRegistrations,
    cancelRegistration,
  } = useEvent();

  const { eligibility } = useEligibility();

  const { matches, loading: matchesLoading, error: matchesError } = useMatches(sportId ?? "");
  useSportMatchRealtime(sportId);

  const { leaderboard, loading: lbLoading, error: lbError } = useLeaderboard(eventId ?? "", sportId ?? "");

  const [contacts, setContacts] = useState<SupportContact[]>([]);

  useEffect(() => {
    if (!eventId || !sportId) return;
    getSportSupportContacts(eventId, sportId)
      .then(setContacts)
      .catch(() => setContacts([]));
  }, [eventId, sportId]);

  const [busyReg, setBusyReg] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [lineupLoading, setLineupLoading] = useState(false);
  const [lineupError, setLineupError] = useState<string | null>(null);
  const [activeRegId, setActiveRegId] = useState<string>("");
  const [lineupsMap, setLineupsMap] = useState<Record<string, TeamLineUpResponse[]>>({});

  useEffect(() => {
    if (!eventId || !sportId) return;
    const load = async () => {
      if (events.length === 0) await fetchLiveEvents();
      await fetchEventSports(eventId);
    };
    load();
  }, [eventId, events.length, fetchEventSports, fetchLiveEvents, sportId]);

  useEffect(() => {
    if (teamId) fetchTeamRegistrations(teamId);
  }, [fetchTeamRegistrations, teamId]);

  const event: EventResponse | undefined = events.find((e) => e.id === eventId);
  const sport: EventSportResponse | undefined = eventSports.find((s) => s.id === sportId);

  const existingRegs: EventRegistrationResponse[] = registrations.filter(
    (r) => r.eventSportId === sportId && r.teamId === teamId
  );

  useEffect(() => {
    setLineupsMap({});
    setActiveRegId("");
  }, [sportId]);

  useEffect(() => {
    if (!activeRegId && existingRegs.length > 0) {
      setActiveRegId(regId(existingRegs[0]));
    }
    // Intentional: dep on length only — never override the user's selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRegs.length]);

  const requireLogin = () => navigate("/login", { state: { from: window.location.pathname } });

  const handleRegister = async (botId: string, _robotName: string, lineup: { membershipId: string; role: string }[]) => {
    if (!teamId || !sportId) return;
    setBusyReg(true);
    setRegError(null);
    try {
      const result = await registerTeamWithLineup({
        eventSportId: sportId,
        teamId,
        botId,
        lineup: lineup.map((e) => ({ teamMembershipId: e.membershipId, lineupRole: e.role as LineupRole })),
      });
      const newRegId = result.registrationId;
      if (newRegId && result.lineup?.length > 0) {
        setLineupsMap((prev) => ({ ...prev, [newRegId]: result.lineup }));
      }
      try { await fetchTeamRegistrations(teamId); } catch { /* non-fatal */ }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setRegError(e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Registration failed.");
    } finally {
      setBusyReg(false);
    }
  };

  const handleCancel = async (registrationId: string) => {
    setBusyReg(true);
    setRegError(null);
    try {
      const ok = await cancelRegistration(registrationId);
      if (!ok) {
        setRegError("Failed to cancel registration. Please try again.");
        return;
      }
      if (activeRegId === registrationId) {
        const remaining = existingRegs.filter((r) => regId(r) !== registrationId);
        setActiveRegId(remaining.length > 0 ? regId(remaining[0]) : "");
      }
      if (teamId) await fetchTeamRegistrations(teamId);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setRegError(e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Failed to cancel registration.");
    } finally {
      setBusyReg(false);
    }
  };

  const handleFetchLineup = async (targetRegId: string) => {
    if (lineupsMap[targetRegId] !== undefined) return;
    setLineupLoading(true);
    setLineupError(null);
    try {
      const data = await getLineup(targetRegId);
      setLineupsMap((prev) => ({ ...prev, [targetRegId]: data }));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setLineupError(e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Failed to load lineup.");
    } finally {
      setLineupLoading(false);
    }
  };

  const handleAddMember = async (membershipId: string, role: string) => {
    if (!activeRegId) return;
    const activeReg = existingRegs.find((r) => regId(r) === activeRegId);
    const robotUUID = activeReg?.robotId ?? activeReg?.botId;
    if (!robotUUID) return;
    setLineupError(null);
    try {
      const result = await addLineupMember({
        sportRegistrationId: activeRegId,
        robotId: robotUUID,
        teamMembershipId: membershipId,
        lineupRole: role as LineupRole,
      });
      setLineupsMap((prev) => ({ ...prev, [activeRegId]: [...(prev[activeRegId] ?? []), result] }));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setLineupError(e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Failed to add member.");
    }
  };

  const handleRemoveMember = async (lineupId: string) => {
    setLineupError(null);
    try {
      await removeLineupMember(lineupId);
      setLineupsMap((prev) => {
        const updated = { ...prev };
        for (const key in updated) {
          updated[key] = updated[key].filter((l) => l.lineupId !== lineupId);
        }
        return updated;
      });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      setLineupError(e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? "Failed to remove member.");
    }
  };

  if (loading && !sport) {
    return <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#666" }}>Loading sport…</div>;
  }
  if (error && !sport) {
    return <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#dc2626" }}>{error}</div>;
  }
  if (!event || !sport) {
    return <div className="evd-page" style={{ padding: "120px 0", textAlign: "center", fontSize: 18, color: "#666" }}>Sport not found.</div>;
  }

  return (
    <div className="evd-page">
      <Hero title={sport.sport?.replace(/_/g, " ") ?? "Sport"} imageUrl={sport.sportThumbnailUrl} />
      <SportDetailsHeader sport={sport} contacts={contacts} />

      <TournamentTabs
        matches={<MatchesTab matches={matches} loading={matchesLoading} error={matchesError} />}
        rankings={<LeaderboardTab leaderboard={leaderboard} loading={lbLoading} error={lbError} />}
        schedule={<ScheduleTab matches={matches} loading={matchesLoading} error={matchesError} sportLabel={sport.sport?.replace(/_/g, " ") ?? "Sport"} />}
        registration={
          <RegistrationTab
            sport={sport}
            teamId={teamId}
            teamCode={teamCode}
            isCaptain={isCaptain}
            isLoggedIn={isAuthenticated}
            existingRegs={existingRegs}
            busyReg={busyReg}
            regError={regError}
            eligibility={eligibility}
            teamMembers={teamMembers}
            onRegister={handleRegister}
            onCancel={handleCancel}
            onManageLineup={(id) => setActiveRegId(id)}
            onDismissError={() => setRegError(null)}
            onRequireLogin={requireLogin}
          />
        }
        lineup={
          <LineupTab
            sport={sport}
            existingRegs={existingRegs}
            activeRegId={activeRegId || (existingRegs[0] ? regId(existingRegs[0]) : "")}
            setActiveRegId={setActiveRegId}
            isCaptain={isCaptain}
            isLoggedIn={isAuthenticated}
            teamMembers={teamMembers}
            lineupsMap={lineupsMap}
            lineupLoading={lineupLoading}
            lineupError={lineupError}
            onFetch={handleFetchLineup}
            onAdd={handleAddMember}
            onRemove={handleRemoveMember}
            onRequireLogin={requireLogin}
          />
        }
      />
    </div>
  );
}
