import { useCallback, useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getGlobalRanking, getAvailablePools, getWeightClasses,
  type GlobalRankingPage,
} from "../api/rankings.api";
import { weightClassLabel } from "../../Robots/constants/weightClasses";
import RankingRow from "../components/RankingRow";
import "../../../styles/rankings.css";

// ── Constants ────────────────────────────────────────────────────────────────

// All sports that can possibly exist (superset — user can always browse any combination)
const ALL_SPORTS = [
  "ROBO_WAR", "ROBO_WAR_OPEN", "ROBO_SOCCER", "ROBO_SOCCER_OPEN",
  "LINE_FOLLOWER", "LINE_FOLLOWER_AUTO", "ROBO_SUMO",
  "DRONE_RACING_SOCCER", "DRONE_RACING_FPV", "RC_ROBO_RACING", "RC_RACING_NITRO",
  "MANUAL_TASK", "THEME_BASED_TASKING", "THEME_BASED_TASKING_OPEN",
  "PLUG_N_PLAY_RACE_SOCCER", "PROJECT_BASED", "AEROMODELLING",
];

const AGE_GROUPS = [
  { label: "Junior Innovators (8–11 yrs)", value: "JUNIOR_INNOVATORS" },
  { label: "Young Engineers (12–17 yrs)",  value: "YOUNG_ENGINEERS" },
  { label: "Robo Minds (18+ yrs)",          value: "ROBO_MINDS" },
];

function toLabel(raw: string) {
  return raw.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Filter select (gradient border + gradient chevron) ────────────────────────

function FilterSelect({
  value, onChange, placeholder, options, disabled, widthClass,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  widthClass: string;
}) {
  const gradientId = useId();
  return (
    <div className={`relative w-full lg:flex-1 lg:min-w-[220px] ${widthClass}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rank-filter-input h-[48px] sm:h-[51px] w-full appearance-none bg-white px-4 pr-10 text-[14px] sm:text-[16px] font-medium text-black/[0.46] outline-none disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" width="16" height="9" viewBox="0 0 16 9" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0162D1" />
            <stop offset="100%" stopColor="#8C6CFF" />
          </linearGradient>
        </defs>
        <path d="M1 1L8 8L15 1" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GlobalRankingsPage() {
  const navigate = useNavigate();

  // Draft filter state — what the selects show, only committed to a fetch on
  // "Apply Filter" (matching the mockup's explicit apply-to-commit UX).
  const [draftSport,       setDraftSport]       = useState("");
  const [draftAgeGroup,    setDraftAgeGroup]    = useState("");
  const [draftWeightClass, setDraftWeightClass] = useState("");

  // Applied filter state — what the current results were actually fetched with.
  const [sport,       setSport]       = useState("");
  const [ageGroup,    setAgeGroup]    = useState("");
  const [weightClass, setWeightClass] = useState("");

  // Data state
  const [pools,             setPools]             = useState<{ sport: string; ageGroup: string }[]>([]);
  const [weightClassOptions, setWeightClassOptions] = useState<string[]>([]);
  const [page,              setPage]              = useState<GlobalRankingPage | null>(null);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);

  // On mount: load pools, then default both draft + applied filters to the first pool with data.
  useEffect(() => {
    getAvailablePools()
      .then((p) => {
        setPools(p);
        const initial = p[0] ?? { sport: "ROBO_WAR", ageGroup: "JUNIOR_INNOVATORS" };
        setDraftSport(initial.sport);
        setDraftAgeGroup(initial.ageGroup);
        setSport(initial.sport);
        setAgeGroup(initial.ageGroup);
      })
      .catch(() => {
        setDraftSport("ROBO_WAR");
        setDraftAgeGroup("JUNIOR_INNOVATORS");
        setSport("ROBO_WAR");
        setAgeGroup("JUNIOR_INNOVATORS");
      });
  }, []);

  // Weight-class options reload as soon as the draft sport changes (no need
  // to wait for Apply Filter — only the actual ranking query waits for that).
  useEffect(() => {
    if (!draftSport) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftWeightClass("");
    getWeightClasses(draftSport)
      .then(setWeightClassOptions)
      .catch(() => setWeightClassOptions([]));
  }, [draftSport]);

  const loadRankings = useCallback(async () => {
    if (!sport || !ageGroup) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getGlobalRanking({
        sport, ageGroup,
        weightClass: weightClass || undefined,
        size: 100,
      });
      setPage(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load rankings";
      setError(message);
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [sport, ageGroup, weightClass]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRankings();
  }, [loadRankings]);

  const handleApplyFilter = () => {
    setSport(draftSport);
    setAgeGroup(draftAgeGroup);
    setWeightClass(draftWeightClass);
  };

  const entries = page?.entries ?? [];
  const hasPoolData = pools.some((p) => p.sport === draftSport && p.ageGroup === draftAgeGroup);

  return (
    <div className="rank-page min-h-screen overflow-auto w-full">
      <main className="relative w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 lg:pt-14 pb-8">

        {/* Background star — hidden below 1100px */}
        <span
          className="rank-bg-deco rank-outline-star absolute left-[405px] top-[45px] w-[132px] h-[112px] pointer-events-none -z-10"
          aria-hidden="true"
        />

        {/* Page title */}
        <h1 className="font-sarpanch text-[26px] sm:text-[30px] lg:text-[35px] font-semibold text-[#0162D1] mb-2" style={{ fontFamily: "Sarpanch, sans-serif" }}>
          Rankings
        </h1>

        {/* ── Sort / filter card ─────────────────────────────────────── */}
        <div className="rank-filter-card mt-1 mb-8 sm:mb-10 w-full bg-white pt-4 pb-5 px-4 sm:px-6 lg:px-9 shadow-[0_4px_4px_1px_rgba(0,0,0,0.25)]">
          <h2 className="mb-3 text-[22px] sm:text-[26px] lg:text-[30px] font-medium text-[#0162D1]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Sort by
          </h2>

          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-4">
            <FilterSelect
              widthClass="lg:max-w-[360px]"
              placeholder="Select Sport"
              value={draftSport}
              onChange={setDraftSport}
              options={ALL_SPORTS.map((s) => ({
                value: s,
                label: `${pools.some((p) => p.sport === s) ? "● " : ""}${toLabel(s)}`,
              }))}
            />

            <FilterSelect
              widthClass="lg:max-w-[303px]"
              placeholder="Select Category"
              value={draftAgeGroup}
              onChange={setDraftAgeGroup}
              options={AGE_GROUPS.map((a) => ({ value: a.value, label: a.label }))}
            />

            <FilterSelect
              widthClass="lg:max-w-[303px]"
              placeholder="Select Weight Class"
              value={draftWeightClass}
              onChange={setDraftWeightClass}
              disabled={weightClassOptions.length === 0}
              options={weightClassOptions.map((wc) => ({ value: wc, label: weightClassLabel(wc) }))}
            />

            <button
              type="button"
              onClick={handleApplyFilter}
              className="h-[48px] sm:h-[51px] w-full lg:w-[159px] lg:ml-auto shrink-0 rounded-md
                         bg-gradient-to-b from-[#0162D1]/[0.75] to-[#8C6CFF]/[0.75]
                         px-6 text-[14px] sm:text-[16px] font-medium text-white
                         shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:brightness-110 cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Global Rankings heading */}
        <h2 className="mb-3 sm:mb-4 text-[20px] sm:text-[24px] lg:text-[28px] font-medium text-[#0162D1]" style={{ fontFamily: "Poppins, sans-serif" }}>
          Global Rankings
        </h2>

        {/* ── States ─────────────────────────────────────────────────── */}
        {(!sport || !ageGroup) && !loading && (
          <div className="rounded-2xl border border-dashed border-[#0162D1]/25 py-20 text-center">
            <p className="text-[#0162D1] font-semibold">Select a sport and category, then Apply Filter</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-[10px] sm:gap-[14px]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[56px] sm:h-[64px] animate-pulse rounded-[12px] bg-black/[0.04]" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && sport && ageGroup && entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#0162D1]/25 py-16 text-center">
            <p className="text-black/60 text-sm">
              {hasPoolData ? "No ranking data yet for this pool." : "No matches played and approved yet for this pool."}
            </p>
          </div>
        )}

        {/* ── Rankings table ─────────────────────────────────────────── */}
        {!loading && entries.length > 0 && (
          <>
            <div className="rank-header mb-3 px-1">
              <span className="rank-col-rank text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">Rank</span>
              <span className="text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">Team</span>
              <span className="text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">Points</span>
              <span className="text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">Events</span>
              <span className="text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">Matches Played</span>
            </div>

            <div className="flex flex-col gap-[10px] sm:gap-[14px] w-full">
              {entries.map((entry) => (
                <RankingRow
                  key={entry.robotId ?? entry.teamId}
                  entry={entry}
                  onOpen={() => navigate(entry.robotId ? `/robot/${entry.robotId}` : `/team/${entry.teamId}`)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
