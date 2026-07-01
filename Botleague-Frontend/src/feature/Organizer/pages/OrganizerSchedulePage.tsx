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
  type OrganizerTeamRegistration,
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
    SCHEDULED:  "bg-blue-500/15 text-blue-400",
    LIVE:       "bg-green-500/15 text-green-400",
    COMPLETED:  "bg-white/8 text-neutral-400",
    CANCELLED:  "bg-red-500/15 text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c[status] ?? "bg-white/8 text-neutral-400"}`}>
      {status === "LIVE" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
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
  const [regs, setRegs]           = useState<OrganizerTeamRegistration[]>([]);
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
        setSelected(new Set(r.map(x => x.id)));
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
    else setSelected(new Set(regs.map(r => r.id)));
  }

  if (loading) return <div className="py-8 text-center text-neutral-400">Loading registrations…</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-4">
        <p className="text-sm font-medium text-yellow-400">Bracket Not Generated</p>
        <p className="mt-0.5 text-xs text-neutral-400">Registration is closed. Configure and generate the tournament bracket below.</p>
      </div>

      {/* Format options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Tournament Format</label>
          <select value={format} onChange={e => setFormat(e.target.value)}
            className="w-full rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500">
            <option value="SINGLE_ELIMINATION">Single Elimination</option>
            <option value="DOUBLE_ELIMINATION">Double Elimination</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Match Type</label>
          <select value={matchType} onChange={e => setMatchType(e.target.value)}
            className="w-full rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500">
            <option value="ONE_VS_ONE">1v1 (One vs One)</option>
            <option value="TRIPLE_THREAT">Triple Threat (3-way)</option>
            <option value="FATAL_FOUR">Fatal Four (4-way)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Match Format</label>
          <select value={matchFmt} onChange={e => setMatchFmt(e.target.value)}
            className="w-full rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500">
            <option value="BO1">Best of 1</option>
            <option value="BO3">Best of 3</option>
            <option value="BO5">Best of 5</option>
          </select>
        </div>
      </div>

      {/* Team list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-neutral-400">Select teams to include ({selected.size}/{regs.length})</p>
          <button onClick={toggleAll} className="text-xs text-red-400 hover:text-red-300">
            {selected.size === regs.length ? "Deselect all" : "Select all"}
          </button>
        </div>
        {regs.length === 0 ? (
          <div className="rounded-xl bg-white/3 p-6 text-center text-sm text-neutral-500">
            No registered teams found for this sport.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {regs.map(r => (
              <label key={r.id} className="flex items-center gap-2.5 rounded-lg bg-white/4 p-3 cursor-pointer hover:bg-white/6 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={e => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(r.id) : next.delete(r.id);
                    setSelected(next);
                  }}
                  className="accent-red-500"
                />
                {r.teamLogoUrl && <img src={r.teamLogoUrl} className="h-6 w-6 rounded object-cover" alt="" />}
                <span className="text-sm text-white">{r.teamName}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={generating || selected.size < 2}
        className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      isLive ? "bg-green-500/5 ring-green-500/30" :
      isCompleted ? "bg-white/3 ring-white/5" :
      isCancelled ? "bg-red-900/10 ring-red-900/20" :
      "bg-white/4 ring-white/8",
    ].join(" ")}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs text-neutral-500">Match {match.matchNumber ?? "—"}</span>
        <StatusPill status={match.status} />
      </div>

      {/* Teams */}
      {isBye ? (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-white">{match.teamAName ?? "TBD"}</span>
          <span className="rounded bg-neutral-700/50 px-2 py-0.5 text-xs text-neutral-400">BYE</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex-1 text-sm font-medium ${winner && winner === match.teamAName ? "text-yellow-400" : "text-white"}`}>
            {match.teamAName ?? "TBD"}
            {match.teamARobotName && <span className="ml-1 text-xs text-neutral-500">({match.teamARobotName})</span>}
          </div>
          <div className="text-center">
            {isLive || isCompleted ? (
              <span className="text-lg font-bold text-white tabular-nums">
                {match.teamAScore ?? 0} <span className="text-neutral-500">–</span> {match.teamBScore ?? 0}
              </span>
            ) : (
              <span className="text-sm text-neutral-500">vs</span>
            )}
          </div>
          <div className={`flex-1 text-right text-sm font-medium ${winner && winner === match.teamBName ? "text-yellow-400" : "text-white"}`}>
            {match.teamBName ?? "TBD"}
            {match.teamBRobotName && <span className="ml-1 text-xs text-neutral-500">({match.teamBRobotName})</span>}
          </div>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-neutral-500 mb-3">
        {match.scheduledAt && <span>🕐 {fmt(match.scheduledAt)}</span>}
        {match.arenaName && <span>📍 {match.arenaName}</span>}
        {winner && <span className="text-yellow-400">🏆 {winner}</span>}
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
                    className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
                  />
                  <button
                    disabled={!schedDt || working}
                    onClick={() => call(() => scheduleMatch(match.matchId, schedDt))}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {working ? "…" : "Save"}
                  </button>
                  <button onClick={() => setScheduling(false)} className="text-xs text-neutral-400 hover:text-white">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setScheduling(true)}
                  className="rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/12 transition-colors"
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
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {working ? "…" : "▶ Start Match"}
            </button>
          )}

          {eventLive && isLive && (
            <div className="space-y-2">
              {/* Live score entry */}
              <div className="flex items-center gap-2">
                <div className="flex-1 text-center">
                  <p className="text-xs text-neutral-500 mb-1">{match.teamAName ?? "Team A"}</p>
                  <input
                    type="number"
                    min={0}
                    value={scoreA}
                    onChange={e => setScoreA(Number(e.target.value))}
                    className="w-20 rounded-lg bg-white/8 px-2 py-1.5 text-center text-lg font-bold text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
                  />
                </div>
                <span className="text-neutral-500 font-bold">vs</span>
                <div className="flex-1 text-center">
                  <p className="text-xs text-neutral-500 mb-1">{match.teamBName ?? "Team B"}</p>
                  <input
                    type="number"
                    min={0}
                    value={scoreB}
                    onChange={e => setScoreB(Number(e.target.value))}
                    className="w-20 rounded-lg bg-white/8 px-2 py-1.5 text-center text-lg font-bold text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={working}
                  onClick={() => call(() => updateMatchScore(match.matchId, { teamAScore: scoreA, teamBScore: scoreB }))}
                  className="rounded-lg bg-white/8 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/12 disabled:opacity-50 transition-colors"
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
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {working ? "…" : "✓ End Match"}
                </button>
                <button
                  disabled={working}
                  onClick={() => call(() => cancelMatch(match.matchId))}
                  className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-600 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}

// ── Match Management Panel ────────────────────────────────────────────────────

function MatchManagementPanel({
  sportId,
  eventLive,
}: {
  sportId: string;
  eventLive: boolean;
}) {
  const [matches, setMatches]     = useState<OrganizerMatch[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getMatchesForSport(sportId)
      .then(setMatches)
      .catch(() => setError("Failed to load matches."))
      .finally(() => setLoading(false));
  }, [sportId]);

  useEffect(() => { load(); }, [load]);

  function handleMatchUpdate(updated: OrganizerMatch) {
    setMatches(prev => prev.map(m => m.matchId === updated.matchId ? updated : m));
  }

  if (loading) return <div className="py-8 text-center text-neutral-400">Loading matches…</div>;
  if (error) return <div className="py-4 text-sm text-red-400">{error}</div>;

  const real = matches.filter(m => !m.isBye);
  const total = real.length;
  const scheduled = real.filter(m => m.scheduledAt).length;
  const completed = real.filter(m => m.status === "COMPLETED").length;
  const live = real.filter(m => m.status === "LIVE").length;

  if (matches.length === 0) {
    return (
      <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">
        No matches found. The bracket may not have been generated yet.
      </div>
    );
  }

  const rounds = groupByRound(matches);

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Matches", value: total, colour: "text-white" },
          { label: "Scheduled", value: scheduled, colour: "text-blue-400" },
          { label: "Live", value: live, colour: "text-green-400" },
          { label: "Completed", value: completed, colour: "text-neutral-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white/4 p-3 text-center ring-1 ring-white/8">
            <p className={`text-xl font-bold ${s.colour}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Round groups */}
      {[...rounds.entries()].map(([round, roundMatches]) => (
        <div key={round}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Round {round}</span>
            <div className="flex-1 border-t border-white/8" />
            <span className="text-xs text-neutral-600">{roundMatches.filter(m => !m.isBye).length} match{roundMatches.filter(m=>!m.isBye).length !== 1 ? "es" : ""}</span>
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
  const [bracketKey, setBracketKey]       = useState(0);

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

  if (eventsLoading) return <div className="flex h-64 items-center justify-center text-neutral-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="mb-1 text-2xl font-bold text-red-500">Schedule & Brackets</h1>
        <p className="mb-6 text-sm text-neutral-500">Generate brackets, schedule matches, and manage live scores.</p>

        {/* Selectors */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={selectedEventId}
            onChange={e => onEventChange(e.target.value)}
            className="rounded-lg bg-white/8 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-red-500"
          >
            <option value="" disabled>Select event…</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.eventName}</option>)}
          </select>

          {selectedEvent && (
            <span className={`self-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              eventLive ? "bg-green-500/15 text-green-400" :
              selectedEvent.status === "PUBLISHED" ? "bg-blue-500/15 text-blue-400" :
              "bg-yellow-500/15 text-yellow-400"
            }`}>
              {selectedEvent.status}
            </span>
          )}
        </div>

        {eventLoading && (
          <div className="py-8 text-center text-neutral-400">Loading sports…</div>
        )}

        {/* Sport tabs */}
        {!eventLoading && sports.length > 0 && (
          <>
            <div className="mb-5 flex flex-wrap gap-2 border-b border-white/8 pb-0">
              {sports.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSportId(s.id)}
                  className={[
                    "pb-2.5 px-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                    selectedSportId === s.id
                      ? "border-red-500 text-white"
                      : "border-transparent text-neutral-400 hover:text-white",
                  ].join(" ")}
                >
                  {s.sport?.replace(/_/g, " ")}
                  {s.weightClass ? ` (${s.weightClass})` : ""}
                  {s.bracketGenerated && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle" title="Bracket ready" />
                  )}
                </button>
              ))}
            </div>

            {/* Sport panel */}
            {sport && (
              <div>
                {/* Sport not yet at REGISTRATION_CLOSED */}
                {sport.status !== "REGISTRATION_CLOSED" && !sport.bracketGenerated && (
                  <div className="rounded-xl bg-white/3 p-8 text-center">
                    <p className="text-neutral-400 text-sm mb-1">Sport is in <span className="text-white font-medium">{sport.status}</span> state.</p>
                    <p className="text-neutral-600 text-xs">Bracket generation is available once registration is closed.</p>
                  </div>
                )}

                {/* Registration closed, no bracket yet */}
                {sport.status === "REGISTRATION_CLOSED" && !sport.bracketGenerated && (
                  <GenerateBracketPanel
                    key={sport.id}
                    sportId={sport.id}
                    onGenerated={() => {
                      setBracketKey(k => k + 1);
                      loadEvent(selectedEventId);
                    }}
                  />
                )}

                {/* Bracket exists — schedule / live management */}
                {sport.bracketGenerated && (
                  <MatchManagementPanel
                    key={`${sport.id}-${bracketKey}`}
                    sportId={sport.id}
                    eventLive={eventLive}
                  />
                )}
              </div>
            )}
          </>
        )}

        {!eventLoading && selectedEvent && sports.length === 0 && (
          <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">
            No sports configured for this event.
          </div>
        )}

        {!selectedEventId && (
          <div className="rounded-xl bg-white/3 p-8 text-center text-neutral-500">
            Select an event to manage its schedule and brackets.
          </div>
        )}
      </div>
    </div>
  );
}
