import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, RefreshCw, Star } from "lucide-react";

import { useAppSelector } from "../../../app/hooks";
import eventBg from "../../../assets/Auth/drone.svg";
import fallbackRobot from "../../../assets/robot.png";
import useDashboard from "../../UserDashboard/hooks/useDashboardData";
import {
  getTeamMemberships,
  type TeamMembershipsApiResponse,
} from "../../UserDashboard/api/userMembership.api";
import useTeam from "../hooks/useTeam";
import { useSponsors } from "../hooks/useSponsors";
import { getTeamBestRank, type GlobalRankingEntry } from "../../Rankings/api/rankings.api";
import useTeamMembership from "../TeamMembership/hooks/useTeamMembership";
import { resolveAvatarSrc } from "../../Profile/constants/avatars";
import TeamLogo from "../../../shared/components/TeamLogo";
import MyTeamEmptyState from "../components/MyTeamEmptyState";
import MobileMyTeam from "../components/MobileMyTeam";
import "../../../styles/teamDashboard.css";

function useCountdown(targetDate?: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const diff = Math.max(target - Date.now(), 0);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
      });
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLabel(value?: string | null) {
  if (!value) return "Not available";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "Date not announced";
  const fmt = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "long", year: "numeric" });
  if (!start) return fmt.format(new Date(end as string));
  if (!end || start === end) return fmt.format(new Date(start));
  return `${fmt.format(new Date(start))} - ${fmt.format(new Date(end))}`;
}

function yearFrom(date?: string | null) {
  if (!date) return "Not available";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "Not available" : String(parsed.getFullYear());
}

function memberName(member: any) {
  return (
    member.userName ||
    member.username ||
    [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
    member.botleagueId ||
    member.userCode ||
    "Team member"
  );
}

function memberInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "T") + (parts[1]?.[0] ?? "");
}

function isMemberActive(member: any) {
  const status = String(member.status ?? "").toUpperCase();
  return member.isActive !== false && status !== "LEFT" && status !== "INACTIVE";
}

function isUsableTeamStatus(status?: string | null) {
  const normalized = String(status ?? "ACTIVE").toUpperCase();
  return !["LEFT", "REJECTED", "DECLINED", "CANCELLED", "REMOVED"].includes(normalized);
}

function memberKey(member: any) {
  return member.membershipId || member.teamMemberId || member.userId || memberName(member);
}

function memberRoleUpper(member: any) {
  return String(member.teamRole || member.role || "").toUpperCase();
}

export default function MyTeam() {
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const [fallbackMemberships, setFallbackMemberships] = useState<TeamMembershipsApiResponse[]>([]);
  const [fallbackMembersLoading, setFallbackMembersLoading] = useState(false);
  const [fallbackMembersError, setFallbackMembersError] = useState<string | null>(null);
  const {
    team,
    teamMemberships,
    isLoading: teamLoading,
    error: teamError,
    loadTeam,
    loadTeamMemberships,
  } = useTeam();

  const {
    activeTeam,
    robots,
    events,
    stats,
    isLoading: dashboardLoading,
    error: dashboardError,
    refresh,
  } = useDashboard();

  // Only an ACTIVE membership may surface team data on this dashboard.
  // `activeTeam` is already filtered to status === "ACTIVE" by useDashboard.
  // The old fallbacks here — `teams.find(...) ?? teams[0]` and a Redux-cached
  // team — would resurface a team the user had LEFT / been REMOVED from (or
  // only holds a pending invite to): the dashboard payload's `teams[]` keeps
  // every past membership, and the Redux copy carried no reliable membership
  // status (it defaulted to "ACTIVE"). A non-active user now falls through to
  // the create-or-join empty state below.
  const dashboardTeam = activeTeam ?? null;

  const resolvedTeam = useMemo(() => {
    // `team` comes from GET /teams/getTeam/my, which the backend only returns
    // for an ACTIVE membership (NO_TEAM otherwise → `team` is null here).
    if (team) return team;
    if (dashboardTeam) {
      return {
        id: dashboardTeam.teamId,
        teamCode: dashboardTeam.teamCode,
        teamName: dashboardTeam.teamName,
        logoUrl: dashboardTeam.teamLogo ?? undefined,
        status: dashboardTeam.status,
        memberRole: dashboardTeam.role,
      };
    }
    return null;
  }, [dashboardTeam, team]);

  const resolvedTeamCode = resolvedTeam?.teamCode || "";

  // Same hook RobotsPage already relies on for this exact captain/VC gate —
  // it does its own independent fetch/lookup, so it isn't at the mercy of
  // whichever of the memberships/dashboard fallbacks above happened to load.
  const { isAdmin: isTeamAdmin } = useTeamMembership(resolvedTeamCode);

  // ── SPONSORS ─────────────────────────────────────────────
  const {
    sponsors,
    loading: sponsorsLoading,
    error: sponsorsError,
  } = useSponsors(resolvedTeam?.id);

  // Pick the sponsor to feature. If your API can flag one as
  // primary/featured, prefer that over array position, e.g.:
  //   sponsors.find((s) => s.isPrimary) ?? sponsors[0] ?? null
  const primarySponsor = useMemo(() => sponsors[0] ?? null, [sponsors]);
  // ─────────────────────────────────────────────────────────

  // ── BEST RANK (any sport, any league) ───────────────────────
  // The team-wide "Rank" pill isn't tied to one sport — it's whichever of
  // the team's robots currently sits highest in ANY pool, so this is a
  // separate fetch from the rest of the dashboard data rather than
  // something derivable from `stats` (which only knows the viewer's own
  // personal dashboard rank, not the team's).
  const [bestRank, setBestRank] = useState<GlobalRankingEntry | null>(null);
  useEffect(() => {
    if (!resolvedTeam?.id) {
      setBestRank(null);
      return;
    }
    let cancelled = false;
    getTeamBestRank(resolvedTeam.id)
      .then((entry) => { if (!cancelled) setBestRank(entry); })
      .catch(() => { if (!cancelled) setBestRank(null); });
    return () => { cancelled = true; };
  }, [resolvedTeam?.id]);
  const teamRankLabel = bestRank ? bestRank.rank : "Pending";
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const loadFallbackMembers = async () => {
      if (!resolvedTeamCode || teamMemberships.length > 0) {
        setFallbackMemberships([]);
        return;
      }

      try {
        setFallbackMembersLoading(true);
        setFallbackMembersError(null);
        const data = await getTeamMemberships(resolvedTeamCode);
        if (!cancelled) setFallbackMemberships(data);
      } catch (err: any) {
        if (!cancelled) {
          setFallbackMembersError(err?.response?.data?.message || "Failed to load team members");
        }
      } finally {
        if (!cancelled) setFallbackMembersLoading(false);
      }
    };

    loadFallbackMembers();
    return () => {
      cancelled = true;
    };
  }, [resolvedTeamCode, teamMemberships.length]);

  const effectiveMemberships = teamMemberships.length > 0 ? teamMemberships : fallbackMemberships;
  const members = useMemo(
    () => effectiveMemberships.flatMap((entry) => entry.members ?? []),
    [effectiveMemberships]
  );

  // Only the captain/vice-captain may edit team details — same gate the
  // backend and the Edit Team page itself enforce. Checked two ways since
  // they come from independent sources: the roster lookup (matching self
  // by id/botleagueId) and resolvedTeam.memberRole (populated straight off
  // the dashboard's own per-team role field) — either one confirming
  // captain/VC is enough, so a gap in one path doesn't silently hide the button.
  const selfMember = members.find(
    (m: { userId?: string; botleagueId?: string }) =>
      (!!authUser?.id && m.userId === authUser.id) ||
      (!!authUser?.botleagueId && m.botleagueId === authUser.botleagueId)
  );
  const ADMIN_ROLES = ["CAPTAIN", "VICE_CAPTAIN"];
  const canEditTeam =
    isTeamAdmin ||
    ADMIN_ROLES.includes(memberRoleUpper(selfMember || {})) ||
    ADMIN_ROLES.includes(String((resolvedTeam as { memberRole?: string } | null)?.memberRole || "").toUpperCase());

  // Squad panel always shows 3 people (when the team has that many): self,
  // captain, vice-captain. If there's no vice-captain, or self/captain/VC
  // collapse onto fewer distinct people (e.g. self IS the captain), backfill
  // with any other member so the preview still has 3. The header count
  // separately reflects the true active squad size.
  const squadPreview = useMemo(() => {
    const isSelf = (member: any) =>
      (!!authUser?.id && member.userId === authUser.id) ||
      (!!authUser?.botleagueId && member.botleagueId === authUser.botleagueId);

    const self = members.find(isSelf);
    const captain = members.find((m) => memberRoleUpper(m) === "CAPTAIN");
    const viceCaptain = members.find((m) => memberRoleUpper(m) === "VICE_CAPTAIN");

    const seen = new Set<string>();
    const preview: any[] = [];

    const tryAdd = (candidate: any) => {
      if (!candidate || preview.length >= 3) return;
      const key = memberKey(candidate);
      if (seen.has(key)) return;
      seen.add(key);
      preview.push(candidate);
    };

    tryAdd(self);
    tryAdd(captain);
    tryAdd(viceCaptain);

    // Backfill with other active members first, then anyone at all, until
    // we reach 3 or run out of teammates.
    if (preview.length < 3) {
      members.filter(isMemberActive).forEach(tryAdd);
    }
    if (preview.length < 3) {
      members.forEach(tryAdd);
    }

    return preview;
  }, [members, authUser]);

  const nextEvent = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((event) => event.startDate && new Date(event.startDate).getTime() >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] ?? events[0] ?? null;
  }, [events]);

  const featuredImage = nextEvent?.logoURL || eventBg;
  const countdown = useCountdown(nextEvent?.startDate);
  const teamRobots = useMemo(() => {
    const teamIds = new Set([resolvedTeam?.id, dashboardTeam?.teamId].filter(Boolean));
    return teamIds.size > 0
      ? robots.filter((robot) => !robot.teamId || teamIds.has(robot.teamId))
      : robots;
  }, [dashboardTeam?.teamId, resolvedTeam?.id, robots]);
  const primaryRobot = teamRobots[0] ?? null;
  const sideRobots = teamRobots.slice(1, 4);
  const loading = teamLoading || dashboardLoading || fallbackMembersLoading || sponsorsLoading;
  const error = teamError || dashboardError || fallbackMembersError || sponsorsError;
  const currentTeamName = resolvedTeam?.teamName || "Your Team";
  const currentTeamCode = resolvedTeam?.teamCode || "Not assigned";
  const teamLogo = resolvedTeam?.logoUrl;
  const location = [resolvedTeam?.city, resolvedTeam?.state, resolvedTeam?.country].filter(Boolean).join(", ");
  const isActive = isUsableTeamStatus(resolvedTeam?.status);

  const handleRefresh = async () => {
    refresh();
    await loadTeam();
    if (resolvedTeamCode) {
      await loadTeamMemberships();
      const data = await getTeamMemberships(resolvedTeamCode);
      setFallbackMemberships(data);
    }
  };

  if (loading && !resolvedTeam) {
    return (
      <main className="teamdash-page teamdash-state">
        <div className="teamdash-spinner" />
        <p>Loading your team...</p>
      </main>
    );
  }

  if (!resolvedTeam) {
    return (
      <main className="teamdash-page">
        <MyTeamEmptyState onCreateClick={() => navigate("/create-team")} />
        {error && (
          <div className="teamdash-error" style={{ maxWidth: "1152px", margin: "0 auto" }}>
            <span>{error}</span>
            <button type="button" onClick={handleRefresh}>
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <>
    <main className="teamdash-page teamdash-desktop-only">
      <div className="teamdash-content">
        <div className="teamdash-top-row">
          <h1>Welcome back, {currentTeamName}!</h1>
          <button type="button" className="teamdash-chat-btn" onClick={() => navigate("/messages")}>
            Chats
          </button>
        </div>

        {error && (
          <div className="teamdash-error">
            <span>{error}</span>
            <button type="button" onClick={handleRefresh}>
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        <section
          className="teamdash-event-banner"
          style={{ backgroundImage: `url(${featuredImage})` }}
        >
          <div className="teamdash-event-overlay" />
          <div className="teamdash-event-copy">
            <div className="teamdash-event-badges">
              <span className="teamdash-event-badge">{nextEvent ? "FEATURED" : "TEAM"}</span>
              <span className="teamdash-event-subtitle">{nextEvent ? "Next Arena" : "Team Overview"}</span>
            </div>
            <h2>{nextEvent?.eventName || currentTeamName}</h2>
            <div className="teamdash-event-meta">
              <span>
                <MapPin size={14} /> {nextEvent ? [nextEvent.venueName, nextEvent.city, nextEvent.state].filter(Boolean).join(", ") : location || "Location not added"}
              </span>
              <span>
                <Calendar size={14} /> {nextEvent ? formatDateRange(nextEvent.startDate, nextEvent.endDate) : `In league since ${yearFrom(team?.createdAt)}`}
              </span>
            </div>
            <button type="button" className="teamdash-event-cta" onClick={() => navigate(nextEvent ? `/events/${nextEvent.eventId}` : "/browse-events")}>
              {nextEvent ? "View Details" : "Browse Events"}
            </button>
          </div>

          <div className="teamdash-countdown">
            <div className="teamdash-countdown-box">
              <strong>{pad(countdown.days)}</strong>
              <span>Days</span>
            </div>
            <span className="teamdash-countdown-sep">:</span>
            <div className="teamdash-countdown-box">
              <strong>{pad(countdown.hours)}</strong>
              <span>Hours</span>
            </div>
            <span className="teamdash-countdown-sep">:</span>
            <div className="teamdash-countdown-box">
              <strong>{pad(countdown.mins)}</strong>
              <span>Mins</span>
            </div>
          </div>
        </section>

        <div className="teamdash-overview-grid">
          <section className="teamdash-team-panel">
            <div className="teamdash-rank-pill">
              <Star size={16} fill="currentColor" />
              Rank - {teamRankLabel}
            </div>

            <div className="teamdash-team-copy">
              <span className="teamdash-active-pill">
              <span /> {isActive ? "Active" : toLabel(resolvedTeam?.status)}
              </span>
           
              <h2>{currentTeamName}</h2>
              <p>Team ID - {currentTeamCode}</p>
              <p>
                <strong>{stats.winRateNum || 0}%</strong> Win Rate
              </p>

              <div className="teamdash-since">
                <span>In The League Since {yearFrom(resolvedTeam?.createdAt)}</span>
                {primarySponsor ? (
                  primarySponsor.website ? (
                    <a href={primarySponsor.website} target="_blank" rel="noopener noreferrer">
                      Sponsored By {primarySponsor.sponsorName}
                    </a>
                  ) : (
                    <a href="#team-info">Sponsored By {primarySponsor.sponsorName}</a>
                  )
                ) : (
                  <a href="#team-info">{resolvedTeam?.institutionName || location || resolvedTeam?.memberRole || "Team profile details pending"}</a>
                )}
              </div>
            </div>

            {canEditTeam && (
              <button type="button" className="teamdash-edit-btn" onClick={() => navigate("/my-team/edit")}>
                Edit Team
              </button>
            )}

            <div className="teamdash-team-image">
              <TeamLogo src={teamLogo} alt={currentTeamName} />
            </div>
          </section>

          <aside className="teamdash-squad-panel">
            <h2>Active Squad ({members.filter(isMemberActive).length})</h2>
            <div className="teamdash-member-list">
              {Array.from({ length: 3 }).map((_, i) => {
                const member = squadPreview[i];
                if (!member) {
                  return (
                    <div className="teamdash-member teamdash-member-empty" key={`empty-${i}`}>
                      <span className="teamdash-avatar teamdash-avatar-empty" />
                      <div className="teamdash-member-info">
                        <strong>Empty Slot</strong>
                        <span>No member yet</span>
                      </div>
                    </div>
                  );
                }
                const name = memberName(member);
                const photoSrc = resolveAvatarSrc(member.profilePhotoUrl);
                return (
                  <div className="teamdash-member" key={member.membershipId || member.teamMemberId || member.userId || name}>
                    {photoSrc ? (
                      <img src={photoSrc} alt={name} className="teamdash-avatar" />
                    ) : (
                      <span className="teamdash-avatar teamdash-avatar-fallback">{memberInitials(name)}</span>
                    )}
                    <div className="teamdash-member-info">
                      <strong>{name}</strong>
                      <span>{toLabel(member.teamRole || member.role)}</span>
                    </div>
                    <em className={isMemberActive(member) ? "active" : "offline"}>
                      {isMemberActive(member) ? "Active" : "Offline"}
                    </em>
                  </div>
                );
              })}
            </div>
            <button type="button" className="teamdash-manage-btn" onClick={() => navigate("/my-team/members")}>
              Member Management
            </button>
          </aside>
        </div>

        <section className="teamdash-machines" id="robots">
          <div className="teamdash-machines-head">
            <h2>Team Build</h2>
            <button type="button" onClick={() => navigate("/robots")}>View All</button>
          </div>

          {primaryRobot ? (
            <div className="teamdash-build-stage">
              {/* LEFT: main robot card */}
              <div className="teamdash-build-left">
                <img className="teamdash-build-left-img" src={primaryRobot.robotIMG || fallbackRobot} alt={primaryRobot.robotName} />
                <div className="teamdash-build-left-overlay" />
                <div className="teamdash-build-left-active">{toLabel(primaryRobot.status)}</div>
              </div>

              {/* RIGHT: up to 3 side panels, sit behind the purple banner */}
              {sideRobots.map((robot, i) => (
                <div className={"teamdash-build-panel teamdash-build-panel--" + "abc"[i]} key={robot.id}>
                  <div className="teamdash-build-panel-dark" />
                  <img className="teamdash-build-panel-img" src={robot.robotIMG || fallbackRobot} alt={robot.robotName} />
                  <div className="teamdash-build-panel-active">{toLabel(robot.status)}</div>
                </div>
              ))}

              {/* PURPLE ANGLED STAT BANNER — overlaps the first side panel */}
              <div className="teamdash-build-banner">
                <div className="teamdash-build-banner-inner">
                  <div className="teamdash-bb-name">{primaryRobot.robotName}</div>
                  <div className="teamdash-bb-tag">{toLabel(primaryRobot.category)}</div>
                  <div className="teamdash-bb-stats">
                    <div className="teamdash-bb-col">
                      <div className="teamdash-bb-num">{stats.wins}</div>
                      <div className="teamdash-bb-sub">Victories</div>
                    </div>
                    <div className="teamdash-bb-col">
                      <div className="teamdash-bb-num">{toLabel(primaryRobot.weightClass)}</div>
                      <div className="teamdash-bb-sub">Class</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="teamdash-empty-machines">
              <img src={fallbackRobot} alt="" />
              <div>
                <h3>No robots yet</h3>
                <p>Add your first robot to connect it with this team.</p>
              </div>
              <button type="button" onClick={() => navigate("/robots")}>Add Robot</button>
            </div>
          )}
        </section>
      </div>
    </main>

    <div className="teamdash-mobile-only">
      <MobileMyTeam
        currentTeamName={currentTeamName}
        currentTeamCode={currentTeamCode}
        teamLogo={teamLogo}
        isActive={isActive}
        statusLabel={toLabel(resolvedTeam?.status)}
        rankLabel={teamRankLabel}
        winRatePct={stats.winRateNum || 0}
        sinceYear={yearFrom(resolvedTeam?.createdAt)}
        sinceLine={
          primarySponsor
            ? `Sponsored By ${primarySponsor.sponsorName}`
            : resolvedTeam?.institutionName || location || (resolvedTeam as { memberRole?: string } | null)?.memberRole || "Team profile details pending"
        }
        sinceLineHref={(primarySponsor && primarySponsor.website) || "#team-info"}
        canEditTeam={canEditTeam}
        onEditTeam={() => navigate("/my-team/edit")}
        error={error}
        onRetry={handleRefresh}
        onOpenChats={() => navigate("/messages")}
        featuredImage={featuredImage}
        hasEvent={!!nextEvent}
        eventName={nextEvent?.eventName || currentTeamName}
        eventLocationLabel={
          nextEvent
            ? [nextEvent.venueName, nextEvent.city, nextEvent.state].filter(Boolean).join(", ")
            : location || "Location not added"
        }
        eventDateLabel={
          nextEvent ? formatDateRange(nextEvent.startDate, nextEvent.endDate) : `In league since ${yearFrom(team?.createdAt)}`
        }
        eventCtaLabel={nextEvent ? "View Details" : "Browse Events"}
        onViewEvent={() => navigate(nextEvent ? `/events/${nextEvent.eventId}` : "/browse-events")}
        countdown={countdown}
        activeSquadCount={members.filter(isMemberActive).length}
        squadPreview={squadPreview.map((member) => {
          const name = memberName(member);
          return {
            key: memberKey(member),
            name,
            roleLabel: toLabel(member.teamRole || member.role),
            photoSrc: resolveAvatarSrc(member.profilePhotoUrl),
            initials: memberInitials(name),
            isActive: isMemberActive(member),
          };
        })}
        onManageMembers={() => navigate("/my-team/members")}
        robots={teamRobots.map((robot) => ({
          id: robot.id,
          image: robot.robotIMG || fallbackRobot,
          name: robot.robotName,
          category: toLabel(robot.category),
          statusLabel: toLabel(robot.status),
          weightClassLabel: toLabel(robot.weightClass),
        }))}
        wins={stats.wins}
        onViewAllRobots={() => navigate("/robots")}
        onAddRobot={() => navigate("/robots")}
      />
    </div>
    </>
  );
}