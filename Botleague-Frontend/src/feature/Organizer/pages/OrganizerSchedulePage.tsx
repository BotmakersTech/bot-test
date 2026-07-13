import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getMyEvents,
  getMyEventById,
  getMatchesForSport,
  getRegistrationsForSport,
  generateBracket,
  scheduleMatch,
  startMatch,
  updateMatchScore,
  completeMatch,
  cancelMatch,
  type OrganizerEvent,
  type OrganizerSport,
  type OrganizerMatch,
  type EventSportRegistration,
} from "../api/organizer.api";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(dt?: string) {
  if (!dt) return "—";
  try { return new Date(dt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
  catch { return dt; }
}

function groupByRound(matches: OrganizerMatch[]): Map<number, OrganizerMatch[]> {
  const map = new Map<number, OrganizerMatch[]>();
  for (const m of matches) {
    const r = m.roundNumber ?? 1;
    if (!map.has(r)) map.set(r, []);
    map.get(r)!.push(m);
  }
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]));
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const c: Record<string, string> = {
    SCHEDULED:  "bg-[#4c8ee7]/15 text-[#3567cf]",
    LIVE:       "bg-[#1fa952]/15 text-[#1fa952]",
    COMPLETED:  "bg-[#4b86e8]/8 text-[#5d5d5d]",
    CANCELLED:  "bg-[#e04b4b]/15 text-[#e04b4b]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c[status] ?? "bg-[#4b86e8]/8 text-[#5d5d5d]"}`}>
      {status === "LIVE" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-[#1fa952] animate-pulse" />}
      {status}
    </span>
  );
}

// ── Generate Bracket Panel ────────────────────────────────────────────────────

function GenerateBracketPanel({
  sportId,
  onGenerated,
}: {
  sportId: string;
  onGenerated: () => void;
}) {
  const [regs, setRegs]           = useState<EventSportRegistration[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [format, setFormat]       = useState("SINGLE_ELIMINATION");
  const [matchType, setMatchType] = useState("ONE_VS_ONE");
  const [matchFmt, setMatchFmt]   = useState("BO1");

  useEffect(() => {
    setLoading(true);
    getRegistrationsForSport(sportId)
      .then(r => {
        setRegs(r);
        setSelected(new Set(r.map(x => x.registrationId)));
      })
      .catch(() => setError("Failed to load registrations"))
      .finally(() => setLoading(false));
  }, [sportId]);

  async function handleGenerate() {
    if (selected.size < 2) { setError("Need at least 2 teams to generate a bracket."); return; }
    setGenerating(true);
    setError(null);
    try {
      await generateBracket({
        eventSportId: sportId,
        teamRegistrationIds: [...selected],
        tournamentFormat: format,
        matchType,
        format: matchFmt,
      });
      onGenerated();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to generate bracket");
    } finally {
      setGenerating(false);
    }
  }

  function toggleAll() {
    if (selected.size === regs.length) setSelected(new Set());
    else setSelected(new Set(regs.map(r => r.registrationId)));
  }

  if (loading) return <div className="py-8 text-center text-[#5d5d5d]">Loading registrations…</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-[#eab308]/5 border border-[#eab308]/20 p-4">
        <p className="text-sm font-medium text-[#a16207]">Bracket Not Generated</p>
        <p className="mt-0.5 text-xs text-[#5d5d5d]">Registration is closed. Configure and generate the tournament bracket below.</p>
      </div>

      {/* Format options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[#5d5d5d] mb-1 font-semibold">Tournament Format</label>
          <select value={format} onChange={e => setFormat(e.target.value)}
            className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]">
            <option value="SINGLE_ELIMINATION">Single Elimination</option>
            <option value="DOUBLE_ELIMINATION">Double Elimination</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#5d5d5d] mb-1 font-semibold">Match Type</label>
          <select value={matchType} onChange={e => setMatchType(e.target.value)}
            className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]">
            <option value="ONE_VS_ONE">1v1 (One vs One)</option>
            <option value="TRIPLE_THREAT">Triple Threat (3-way)</option>
            <option value="FATAL_FOUR">Fatal Four (4-way)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#5d5d5d] mb-1 font-semibold">Match Format</label>
          <select value={matchFmt} onChange={e => setMatchFmt(e.target.value)}
            className="w-full rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]">
            <option value="BO1">Best of 1</option>
            <option value="BO3">Best of 3</option>
            <option value="BO5">Best of 5</option>
          </select>
        </div>
      </div>

      {/* Team list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[#5d5d5d]">Select teams to include ({selected.size}/{regs.length})</p>
          <button onClick={toggleAll} className="text-xs text-[#4c8ee7] hover:text-[#3567cf]">
            {selected.size === regs.length ? "Deselect all" : "Select all"}
          </button>
        </div>
        {regs.length === 0 ? (
          <div className="rounded-xl bg-[#4b86e8]/5 p-6 text-center text-sm text-[#5d5d5d]">
            No registered teams found for this sport.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {regs.map(r => (
              <label key={r.registrationId} className="flex items-center gap-2.5 rounded-lg bg-white/90 border border-[#4b86e8]/20 p-3 cursor-pointer hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(r.registrationId)}
                  onChange={e => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(r.registrationId) : next.delete(r.registrationId);
                    setSelected(next);
                  }}
                  className="accent-[#8c6cff]"
                />
                <span className="text-sm text-[#111111]">
                  {r.teamName}
                  {r.robotName && <span className="text-[#5d5d5d]"> · {r.robotName}</span>}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-[#e04b4b]">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={generating || selected.size < 2}
        className="rounded-lg bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {generating ? "Generating…" : `Generate Bracket (${selected.size} teams)`}
      </button>
    </div>
  );
}

// ── Single Match Card ─────────────────────────────────────────────────────────

function MatchCard({
  match,
  eventLive,
  onUpdated,
}: {
  match: OrganizerMatch;
  eventLive: boolean;
  onUpdated: (updated: OrganizerMatch) => void;
}) {
  const [scheduling, setScheduling] = useState(false);
  const [schedDt, setSchedDt]       = useState(
    match.scheduledAt ? match.scheduledAt.slice(0, 16) : ""
  );
  const [scoreA, setScoreA]         = useState(match.teamAScore ?? 0);
  const [scoreB, setScoreB]         = useState(match.teamBScore ?? 0);
  const [working, setWorking]       = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  async function call(fn: () => Promise<OrganizerMatch>) {
    setWorking(true); setErr(null);
    try { onUpdated(await fn()); }
    catch (e: any) { setErr(e?.response?.data?.message ?? e?.message ?? "Action failed"); }
    finally { setWorking(false); }
  }

  const isBye = match.isBye || (!match.teamBName && !match.teamBRegistrationId);
  const isCompleted = match.status === "COMPLETED";
  const isCancelled = match.status === "CANCELLED";
  const isLive = match.status === "LIVE";
  const isScheduled = match.status === "SCHEDULED";

  const winner = match.winnerRegistrationId
    ? (match.winnerRegistrationId === match.teamARegistrationId
        ? match.teamAName : match.teamBName)
    : null;

  return (
    <div className={[
      "rounded-xl p-4 ring-1 transition-colors",
      isLive ? "bg-[#1fa952]/5 ring-[#1fa952]/30" :
      isCompleted ? "bg-[#4b86e8]/4 ring-[#4b86e8]/15" :
      isCancelled ? "bg-[#e04b4b]/5 ring-[#e04b4b]/15" :
      "bg-white/90 ring-[#4b86e8]/25 border border-[#4b86e8]/25",
    ].join(" ")}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-[#5d5d5d]">Match {match.matchNumber ?? "—"}</span>
        <StatusPill status={match.status} />
      </div>

      {/* Teams */}
      {isBye ? (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-[#111111]">{match.teamAName ?? "TBD"}</span>
          <span className="rounded bg-[#4b86e8]/10 px-2 py-0.5 text-xs text-[#5d5d5d]">BYE</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex-1 text-sm font-medium ${winner && winner === match.teamAName ? "text-[#a16207]" : "text-[#111111]"}`}>
            {match.teamAName ?? "TBD"}
            {match.teamARobotName && <span className="ml-1 text-xs text-[#5d5d5d]">({match.teamARobotName})</span>}
          </div>
          <div className="text-center">
            {isLive || isCompleted ? (
              <span className="text-lg font-bold text-[#111111] tabular-nums">
                {match.teamAScore ?? 0} <span className="text-[#9a9a9a]">–</span> {match.teamBScore ?? 0}
              </span>
            ) : (
              <span className="text-sm text-[#9a9a9a]">vs</span>
            )}
          </div>
          <div className={`flex-1 text-right text-sm font-medium ${winner && winner === match.teamBName ? "text-[#a16207]" : "text-[#111111]"}`}>
            {match.teamBName ?? "TBD"}
            {match.teamBRobotName && <span className="ml-1 text-xs text-[#5d5d5d]">({match.teamBRobotName})</span>}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-[#5d5d5d] mb-3">
        {match.scheduledAt && <span>🕐 {fmt(match.scheduledAt)}</span>}
        {match.arenaName && <span>📍 {match.arenaName}</span>}
        {winner && <span className="text-[#a16207]">🏆 {winner}</span>}
        {match.winMethod && <span>via {match.winMethod.replace(/_/g, " ")}</span>}
      </div>

      {/* Actions */}
      {!isBye && !isCompleted && !isCancelled && (
        <div className="space-y-2">
          {/* Schedule form */}
          {!eventLive && isScheduled && (
            <>
              {scheduling ? (
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="datetime-local"
                    value={schedDt}
                    onChange={e => setSchedDt(e.target.value)}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]"
                  />
                  <button
                    disabled={!schedDt || working}
                    onClick={() => call(() => scheduleMatch(match.matchId, schedDt))}
                    className="rounded-lg bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {working ? "…" : "Save"}
                  </button>
                  <button onClick={() => setScheduling(false)} className="text-xs text-[#5d5d5d] hover:text-[#111111]">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setScheduling(true)}
                  className="rounded-lg bg-[#4b86e8]/10 px-3 py-1.5 text-xs font-medium text-[#3567cf] hover:bg-[#4b86e8]/20 transition-colors"
                >
                  {match.scheduledAt ? "Edit Schedule" : "Set Date & Time"}
                </button>
              )}
            </>
          )}

          {/* LIVE event actions */}
          {eventLive && isScheduled && (
            <button
              disabled={working}
              onClick={() => call(() => startMatch(match.matchId))}
              className="rounded-lg bg-[#1fa952] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {working ? "…" : "▶ Start Match"}
            </button>
          )}

          {eventLive && isLive && (
            <div className="space-y-2">
              {/* Live score entry */}
              <div className="flex items-center gap-2">
                <div className="flex-1 text-center">
                  <p className="text-xs text-[#5d5d5d] mb-1">{match.teamAName ?? "Team A"}</p>
                  <input
                    type="number"
                    min={0}
                    value={scoreA}
                    onChange={e => setScoreA(Number(e.target.value))}
                    className="w-20 rounded-lg bg-white px-2 py-1.5 text-center text-lg font-bold text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]"
                  />
                </div>
                <span className="text-[#9a9a9a] font-bold">vs</span>
                <div className="flex-1 text-center">
                  <p className="text-xs text-[#5d5d5d] mb-1">{match.teamBName ?? "Team B"}</p>
                  <input
                    type="number"
                    min={0}
                    value={scoreB}
                    onChange={e => setScoreB(Number(e.target.value))}
                    className="w-20 rounded-lg bg-white px-2 py-1.5 text-center text-lg font-bold text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={working}
                  onClick={() => call(() => updateMatchScore(match.matchId, { teamAScore: scoreA, teamBScore: scoreB }))}
                  className="rounded-lg bg-[#4b86e8]/10 px-3 py-1.5 text-xs font-medium text-[#3567cf] hover:bg-[#4b86e8]/20 disabled:opacity-50 transition-colors"
                >
                  {working ? "…" : "Update Score"}
                </button>
                <button
                  disabled={working}
                  onClick={async () => {
                    setWorking(true); setErr(null);
                    try {
                      await updateMatchScore(match.matchId, { teamAScore: scoreA, teamBScore: scoreB });
                      onUpdated(await completeMatch(match.matchId));
                    } catch (e: any) {
                      setErr(e?.response?.data?.message ?? e?.message ?? "Failed");
                    } finally { setWorking(false); }
                  }}
                  className="rounded-lg bg-linear-to-br from-[#4c8ee7] to-[#8c6cff] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {working ? "…" : "✓ End Match"}
                </button>
                <button
                  disabled={working}
                  onClick={() => call(() => cancelMatch(match.matchId))}
                  className="rounded-lg bg-[#4b86e8]/10 px-3 py-1.5 text-xs font-medium text-[#5d5d5d] hover:bg-[#4b86e8]/20 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {err && <p className="mt-2 text-xs text-[#e04b4b]">{err}</p>}
    </div>
  );
}

// ── Smart Sport Panel — checks matches first, not bracketGenerated flag ────────

function SmartSportPanel({
  sport,
  eventLive,
  onRefresh,
}: {
  sport: OrganizerSport;
  eventLive: boolean;
  onRefresh: () => void;
}) {
  const [matches, setMatches]   = useState<OrganizerMatch[] | null>(null);
  const [loading, setLoading]   = useState(true);
  const [matchKey, setMatchKey] = useState(0);

  const loadMatches = useCallback(() => {
    setLoading(true);
    getMatchesForSport(sport.id)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [sport.id]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  if (loading) return <div className="py-8 text-center text-[#5d5d5d]">Loading…</div>;

  const hasMatches = matches !== null && matches.length > 0;

  // Matches already exist (generated by anyone, admin or organizer)
  if (hasMatches) {
    return (
      <MatchManagementPanelWithMatches
        key={matchKey}
        initialMatches={matches!}
        eventLive={eventLive}
        onReload={loadMatches}
      />
    );
  }

  // No matches — show generate form if registration is closed (or already flagged)
  const canGenerate = sport.status === "REGISTRATION_CLOSED" || sport.bracketGenerated;

  if (canGenerate) {
    return (
      <GenerateBracketPanel
        key={sport.id}
        sportId={sport.id}
        onGenerated={() => {
          setMatchKey(k => k + 1);
          loadMatches();
          onRefresh();
        }}
      />
    );
  }

  // Too early
  return (
    <div className="rounded-xl bg-[#4b86e8]/5 p-8 text-center">
      <p className="text-[#5d5d5d] text-sm mb-1">
        Sport is in <span className="text-[#111111] font-medium">{sport.status}</span> state.
      </p>
      <p className="text-[#9a9a9a] text-xs">
        Bracket generation is available once registration is closed.
      </p>
    </div>
  );
}

// ── Match Management Panel (receives already-loaded matches) ──────────────────

function MatchManagementPanelWithMatches({
  initialMatches,
  eventLive,
  onReload,
}: {
  initialMatches: OrganizerMatch[];
  eventLive: boolean;
  onReload: () => void;
}) {
  const [matches, setMatches] = useState<OrganizerMatch[]>(initialMatches);

  useEffect(() => { setMatches(initialMatches); }, [initialMatches]);

  function handleMatchUpdate(updated: OrganizerMatch) {
    setMatches(prev => prev.map(m => m.matchId === updated.matchId ? updated : m));
  }

  const real      = matches.filter(m => !m.isBye);
  const total     = real.length;
  const scheduled = real.filter(m => m.scheduledAt).length;
  const completed = real.filter(m => m.status === "COMPLETED").length;
  const live      = real.filter(m => m.status === "LIVE").length;
  const rounds    = groupByRound(matches);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-4 gap-3 flex-1">
          {[
            { label: "Total Matches", value: total,     colour: "text-[#111111]" },
            { label: "Scheduled",     value: scheduled, colour: "text-[#4c8ee7]" },
            { label: "Live",          value: live,      colour: "text-[#1fa952]" },
            { label: "Completed",     value: completed, colour: "text-[#5d5d5d]" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/90 p-3 text-center ring-1 ring-[#4b86e8]/25 border border-[#4b86e8]/25">
              <p className={`text-xl font-bold ${s.colour}`}>{s.value}</p>
              <p className="text-xs text-[#5d5d5d] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={onReload} className="ml-4 shrink-0 rounded-lg bg-[#4b86e8]/10 px-3 py-2 text-xs text-[#3567cf] hover:bg-[#4b86e8]/20 transition-colors">
          Refresh
        </button>
      </div>

      {[...rounds.entries()].map(([round, roundMatches]) => (
        <div key={round}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-[#5d5d5d] uppercase tracking-wider">Round {round}</span>
            <div className="flex-1 border-t border-[#4b86e8]/20" />
            <span className="text-xs text-[#9a9a9a]">
              {roundMatches.filter(m => !m.isBye).length} match{roundMatches.filter(m => !m.isBye).length !== 1 ? "es" : ""}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {roundMatches.map(m => (
              <MatchCard
                key={m.matchId}
                match={m}
                eventLive={eventLive}
                onUpdated={handleMatchUpdate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OrganizerSchedulePage() {
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get("eventId") ?? "";
  const preselectedSportId = searchParams.get("sportId") ?? "";

  const [events, setEvents]               = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId);
  const [selectedEvent, setSelectedEvent] = useState<OrganizerEvent | null>(null);
  const [selectedSportId, setSelectedSportId] = useState(preselectedSportId);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventLoading, setEventLoading]   = useState(false);

  // Load events list (for dropdown)
  useEffect(() => {
    getMyEvents()
      .then(e => {
        setEvents(e);
        if (!preselectedEventId && e.length > 0) setSelectedEventId(e[0].id);
      })
      .finally(() => setEventsLoading(false));
  }, [preselectedEventId]);

  // Load full event (with sports) when event selected
  const loadEvent = useCallback((eventId: string) => {
    if (!eventId) return;
    setEventLoading(true);
    getMyEventById(eventId)
      .then(ev => {
        setSelectedEvent(ev);
        const sports = ev.sports ?? [];
        if (preselectedSportId && sports.some(s => s.id === preselectedSportId)) {
          setSelectedSportId(preselectedSportId);
        } else if (!selectedSportId && sports.length > 0) {
          setSelectedSportId(sports[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setEventLoading(false));
  }, [preselectedSportId, selectedSportId]);

  useEffect(() => {
    if (selectedEventId) loadEvent(selectedEventId);
  }, [selectedEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sports: OrganizerSport[] = (selectedEvent?.sports as unknown as OrganizerSport[]) ?? [];
  const sport = sports.find(s => s.id === selectedSportId);
  const eventLive = selectedEvent?.status === "LIVE";

  function onEventChange(id: string) {
    setSelectedEventId(id);
    setSelectedEvent(null);
    setSelectedSportId("");
  }

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-[#5d5d5d]">Loading…</div>;

  return (
    <div className="min-h-screen p-6 text-[#111111]">
      <div className="max-w-5xl mx-auto">
        <h1 className="mb-1 text-2xl font-bold text-[#3567cf]" style={{ fontFamily: "'Sarpanch', 'Inter', sans-serif" }}>Schedule &amp; Brackets</h1>
        <p className="mb-6 text-sm text-[#5d5d5d]">Generate brackets, schedule matches, and manage live scores.</p>

        {/* Selectors */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={selectedEventId}
            onChange={e => onEventChange(e.target.value)}
            className="rounded-lg bg-white px-3 py-2 text-sm text-[#111111] ring-1 ring-[#4b86e8]/30 focus:outline-none focus:ring-[#8c6cff]"
          >
            <option value="" disabled>Select event…</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
          </select>

          {selectedEvent && (
            <span className={`self-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              eventLive ? "bg-[#1fa952]/15 text-[#1fa952]" :
              selectedEvent.status === "PUBLISHED" ? "bg-[#4c8ee7]/15 text-[#3567cf]" :
              "bg-[#eab308]/15 text-[#a16207]"
            }`}>
              {selectedEvent.status}
            </span>
          )}
        </div>

        {eventLoading && (
          <div className="py-8 text-center text-[#5d5d5d]">Loading sports…</div>
        )}

        {/* Sport tabs */}
        {!eventLoading && sports.length > 0 && (
          <>
            <div className="mb-5 flex flex-wrap gap-2 border-b border-[#4b86e8]/20 pb-0">
              {sports.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSportId(s.id)}
                  className={[
                    "pb-2.5 px-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                    selectedSportId === s.id
                      ? "border-[#4c8ee7] text-[#111111]"
                      : "border-transparent text-[#5d5d5d] hover:text-[#111111]",
                  ].join(" ")}
                >
                  {s.sport?.replace(/_/g, " ")}
                  {s.weightClass ? ` (${s.weightClass})` : ""}
                  {s.bracketGenerated && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#1fa952] align-middle" title="Bracket ready" />
                  )}
                </button>
              ))}
            </div>

            {/* Sport panel — uses actual matches to decide which view to show */}
            {sport && (
              <SmartSportPanel
                key={sport.id}
                sport={sport}
                eventLive={eventLive}
                onRefresh={() => loadEvent(selectedEventId)}
              />
            )}
          </>
        )}

        {!eventLoading && selectedEvent && sports.length === 0 && (
          <div className="rounded-xl bg-[#4b86e8]/5 p-8 text-center text-[#5d5d5d]">
            No sports configured for this event.
          </div>
        )}

        {!selectedEventId && (
          <div className="rounded-xl bg-[#4b86e8]/5 p-8 text-center text-[#5d5d5d]">
            Select an event to manage its schedule and brackets.
          </div>
        )}
      </div>
    </div>
  );
}
