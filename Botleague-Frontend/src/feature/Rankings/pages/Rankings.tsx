
import { useCallback, useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  getGlobalRanking,
  getAvailablePools,
  type GlobalRankingPage,
} from "../api/rankings.api";
import {
  getPublicLeagueSports,
  type LeagueSport,
} from "../../../shared/api/catalog.api";
import { sportKey } from "../../Event/utils/specPolicy";
import {
  canonicalWeightClass,
  formatWeightClass,
} from "../../Robots/constants/weightClasses";
import { getDashboard } from "../../UserDashboard/api/userDashboard.api";
import RankingRow from "../components/RankingRow";
import RankingsPodium from "../components/RankingsPodium";
import {
  useLeagues,
  formatAgeRange,
} from "../../../temp/pages/leagues/useLeagues";
import "../../../styles/rankings.css";

// Landing default when nobody's picked a filter yet and the viewer has no
// participation history to go on (logged out, or a brand-new account).
const FALLBACK_DEFAULT = {
  sport: "ROBOWAR",
  ageGroup: "ROBO_MINDS",
  weightClass: "60KG",
};

// ── Filter select (gradient border + gradient chevron) ────────────────────────

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  disabled,
  widthClass,
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
    <div
      className={`relative w-full lg:flex-1 lg:min-w-[220px] ${widthClass}`}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rank-filter-input h-[48px] sm:h-[51px] w-full appearance-none bg-white px-4 pr-10 text-[14px] sm:text-[16px] font-medium text-black/[0.46] outline-none disabled:opacity-60"
      >
        <option value="">{placeholder}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <svg
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
        width="16"
        height="9"
        viewBox="0 0 16 9"
        fill="none"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#0162D1" />
            <stop offset="100%" stopColor="#8C6CFF" />
          </linearGradient>
        </defs>

        <path
          d="M1 1L8 8L15 1"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GlobalRankingsPage() {
  const navigate = useNavigate();
  const { leagues } = useLeagues();

  // Draft filter state
  const [draftLeagueSlug, setDraftLeagueSlug] = useState("");
  const [draftSportSlug, setDraftSportSlug] = useState("");
  const [draftWeightKg, setDraftWeightKg] = useState("");

  // Mobile/tablet only
  const [sortOpen, setSortOpen] = useState(false);

  // Applied filter state
  const [sport, setSport] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [weightClass, setWeightClass] = useState("");

  // Data state
  const [pools, setPools] = useState<
    { sport: string; ageGroup: string; weightClass: string }[]
  >([]);

  const [leagueSports, setLeagueSports] = useState<LeagueSport[]>([]);
  const [leagueSportsLoading, setLeagueSportsLoading] = useState(false);

  const [page, setPage] = useState<GlobalRankingPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Available ranking pools ────────────────────────────────────────────────

  useEffect(() => {
    getAvailablePools()
      .then(setPools)
      .catch(() => setPools([]));
  }, []);

  // ── Landing default ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const apply = (s: string, ag: string, wc: string) => {
      if (cancelled) return;

      setSport(s);
      setAgeGroup(ag);
      setWeightClass(wc);
    };

    Promise.all([
      getDashboard().catch(() => null),
      getAvailablePools().catch(
        () =>
          [] as {
            sport: string;
            ageGroup: string;
            weightClass: string;
          }[],
      ),
    ]).then(([data, livePools]) => {
      if (cancelled) return;

      const tally = new Map<
        string,
        {
          sport: string;
          ageGroup: string;
          weightClass: string;
          count: number;
        }
      >();

      for (const ev of data?.events ?? []) {
        const s = ev.sport?.sport
          ? sportKey(ev.sport.sport)
          : undefined;

        const ag = ev.sport?.ageGroup;

        if (!s || !ag) continue;

        const wc = canonicalWeightClass(ev.sport?.weightClass);

        const key = `${s}::${ag}::${wc}`;

        const existing = tally.get(key);

        if (existing) {
          existing.count += 1;
        } else {
          tally.set(key, {
            sport: s,
            ageGroup: ag,
            weightClass: wc,
            count: 1,
          });
        }
      }

      let mostPlayed:
        | {
            sport: string;
            ageGroup: string;
            weightClass: string;
            count: number;
          }
        | null = null;

      for (const entry of tally.values()) {
        if (!mostPlayed || entry.count > mostPlayed.count) {
          mostPlayed = entry;
        }
      }

      const poolHasData = (
        s: string,
        ag: string,
        wc: string,
      ) =>
        livePools.some(
          (p) =>
            p.sport === s &&
            p.ageGroup === ag &&
            p.weightClass === wc,
        );

      if (
        mostPlayed &&
        poolHasData(
          mostPlayed.sport,
          mostPlayed.ageGroup,
          mostPlayed.weightClass,
        )
      ) {
        apply(
          mostPlayed.sport,
          mostPlayed.ageGroup,
          mostPlayed.weightClass,
        );
      } else if (livePools.length > 0) {
        apply(
          livePools[0].sport,
          livePools[0].ageGroup,
          livePools[0].weightClass,
        );
      } else {
        apply(
          FALLBACK_DEFAULT.sport,
          FALLBACK_DEFAULT.ageGroup,
          FALLBACK_DEFAULT.weightClass,
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Draft selections ──────────────────────────────────────────────────────

  const draftLeague =
    leagues.find((l) => l.slug === draftLeagueSlug) ?? null;

  const selectedLeagueSport =
    leagueSports.find(
      (ls) => ls.sportSlug === draftSportSlug,
    ) ?? null;

  const weightOptions: {
    weightKg: number;
    label: string;
  }[] = selectedLeagueSport
    ? selectedLeagueSport.weightClasses.length > 0
      ? selectedLeagueSport.weightClasses.map((wc) => ({
          weightKg: wc.weightKg,
          label: `${wc.weightKg} kg`,
        }))
      : selectedLeagueSport.weightLimitKg != null
        ? [
            {
              weightKg: selectedLeagueSport.weightLimitKg,
              label: `${selectedLeagueSport.weightLimitKg} kg`,
            },
          ]
        : []
    : [];

  // ── League -> Sports ───────────────────────────────────────────────────────

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftSportSlug("");

    setDraftWeightKg("");

    if (!draftLeagueSlug) {
      setLeagueSports([]);
      return;
    }

    let cancelled = false;

    setLeagueSportsLoading(true);

    getPublicLeagueSports(draftLeagueSlug)
      .then((rows) => {
        if (!cancelled) {
          setLeagueSports(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLeagueSports([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLeagueSportsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [draftLeagueSlug]);

  // ── Sport -> Weight Classes ────────────────────────────────────────────────

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftWeightKg("");
  }, [draftSportSlug]);

  // ── Load rankings ──────────────────────────────────────────────────────────

  const loadRankings = useCallback(async () => {
    if (!sport || !ageGroup) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getGlobalRanking({
        sport,
        ageGroup,
        weightClass: weightClass || undefined,
        size: 100,
      });

      setPage(data);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Failed to load rankings";

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

  // ── Filter validation ──────────────────────────────────────────────────────

  const weightRequired = weightOptions.length > 0;
  const weightMissing = weightRequired && !draftWeightKg;

  // ── Apply filter ───────────────────────────────────────────────────────────

  const handleApplyFilter = () => {
    if (
      !draftLeague ||
      !selectedLeagueSport ||
      weightMissing
    ) {
      return;
    }

    setSport(
      sportKey(selectedLeagueSport.sportName),
    );

    setAgeGroup(draftLeague.ageGroupValue);

    setWeightClass(
      canonicalWeightClass(draftWeightKg),
    );
  };

  const entries = page?.entries ?? [];

  const hasPoolData = pools.some(
    (p) =>
      p.sport === sport &&
      p.ageGroup === ageGroup &&
      p.weightClass === weightClass,
  );

  return (
    <div className="rank-page min-h-screen overflow-auto w-full">
      <main className="relative w-full mx-auto">

        {/* Background star — hidden below 1100px */}
        <span
          className="rank-bg-deco rank-outline-star absolute left-[405px] top-[45px] w-[132px] h-[112px] pointer-events-none -z-10"
          aria-hidden="true"
        />

        {/* ────────────────────────────────────────────────────────────────
            PODIUM
            This section intentionally stays OUTSIDE the p-8 wrapper.
            ──────────────────────────────────────────────────────────────── */}
        {!loading && entries.length > 0 && (
          <RankingsPodium
            entries={entries}
            onOpen={(entry) =>
              navigate(
                entry.robotId
                  ? `/robot/${entry.robotId}`
                  : `/team/${entry.teamId}`,
              )
            }
          />
        )}

        {/* ────────────────────────────────────────────────────────────────
            EVERYTHING BELOW PODIUM GETS p-8
            ──────────────────────────────────────────────────────────────── */}
        <div className="p-8">

          {/* Page title */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <h1 className="font-display text-[clamp(20px,4vw,38px)] font-medium text-[#0162D1]">
              Rankings
            </h1>

            <button
              type="button"
              onClick={() =>
                setSortOpen((v) => !v)
              }
              className="hidden max-[950px]:flex items-center gap-2 h-[42px] px-4 rounded-md border border-[#0162D1] bg-white text-[14px] font-medium text-[#0162D1] cursor-pointer shrink-0"
            >
              <SlidersHorizontal size={16} />

              Sort

              <ChevronDown
                size={16}
                className={`transition-transform ${
                  sortOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* ──────────────────────────────────────────────────────────────
              SORT / FILTER CARD
              ────────────────────────────────────────────────────────────── */}
          <div
            className={`rank-filter-card mt-1 mb-8 sm:mb-10 w-full bg-white pt-4 pb-5 px-4 sm:px-6 lg:px-9 shadow-[0_4px_4px_1px_rgba(0,0,0,0.25)] ${
              sortOpen
                ? ""
                : "max-[950px]:hidden"
            }`}
          >
            <h2
              className="mb-3 text-[22px] sm:text-[26px] lg:text-[30px] font-medium text-[#0162D1]"
              style={{
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Sort by
            </h2>

            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-4">

              {/* League */}
              <FilterSelect
                widthClass="lg:max-w-[303px]"
                placeholder="Select League"
                value={draftLeagueSlug}
                onChange={setDraftLeagueSlug}
                options={leagues.map((l) => ({
                  value: l.slug,
                  label: `${l.shortName} (${formatAgeRange(
                    l.minAge,
                    l.maxAge,
                  )} yrs)`,
                }))}
              />

              {/* Sport */}
              <FilterSelect
                widthClass="lg:max-w-[360px]"
                placeholder={
                  leagueSportsLoading
                    ? "Loading sports…"
                    : "Select Sport"
                }
                value={draftSportSlug}
                onChange={setDraftSportSlug}
                disabled={
                  !draftLeagueSlug ||
                  leagueSportsLoading
                }
                options={leagueSports.map(
                  (ls) => ({
                    value: ls.sportSlug,
                    label: ls.sportName,
                  }),
                )}
              />

              {/* Weight Class */}
              <FilterSelect
                widthClass="lg:max-w-[303px]"
                placeholder="Select Weight Class"
                value={draftWeightKg}
                onChange={setDraftWeightKg}
                disabled={
                  !draftSportSlug ||
                  weightOptions.length === 0
                }
                options={weightOptions.map(
                  (w) => ({
                    value: String(w.weightKg),
                    label: formatWeightClass(
                      w.label,
                    ),
                  }),
                )}
              />

              {/* Apply */}
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={
                  !draftLeagueSlug ||
                  !draftSportSlug ||
                  weightMissing
                }
                className="h-[48px] sm:h-[51px] w-full lg:w-[159px] lg:ml-auto shrink-0 rounded-md
                           bg-gradient-to-b from-[#0162D1]/[0.75] to-[#8C6CFF]/[0.75] disabled:opacity-50 disabled:cursor-not-allowed
                           px-6 text-[14px] sm:text-[16px] font-medium text-white
                           shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition hover:brightness-110 cursor-pointer"
              >
                Apply Filter
              </button>
            </div>

            {/* Weight warning */}
            {weightMissing && (
              <p className="mt-3 text-[13px] text-[#0162D1]/70">
                Select a weight class —{" "}
                {selectedLeagueSport?.sportName}{" "}
                ranks separately per weight class.
              </p>
            )}
          </div>

          {/* ──────────────────────────────────────────────────────────────
              STATES
              ────────────────────────────────────────────────────────────── */}

          {(!sport || !ageGroup) &&
            !loading && (
              <div className="rounded-2xl border border-dashed border-[#0162D1]/25 py-20 text-center">
                <p className="text-[#0162D1] font-semibold">
                  Select a league and sport, then Apply Filter
                </p>
              </div>
            )}

          {loading && (
            <div className="flex flex-col gap-[10px] sm:gap-[14px]">
              {[1, 2, 3, 4, 5].map(
                (i) => (
                  <div
                    key={i}
                    className="h-[56px] sm:h-[64px] animate-pulse rounded-[12px] bg-black/[0.04]"
                  />
                ),
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            sport &&
            ageGroup &&
            entries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#0162D1]/25 py-16 text-center">
                <p className="text-black/60 text-sm">
                  {hasPoolData
                    ? "No ranking data yet for this pool."
                    : "No matches played and approved yet for this pool."}
                </p>
              </div>
            )}

          {/* ──────────────────────────────────────────────────────────────
              RANKINGS TABLE
              ────────────────────────────────────────────────────────────── */}

          {!loading &&
            entries.length > 0 && (
              <>
                <div className="rank-header mb-3 px-1">
                  <span className="rank-col-rank text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">
                    Rank
                  </span>

                  <span className="text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">
                    Team
                  </span>

                  <span className="text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">
                    Points
                  </span>

                  <span className="text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">
                    Techfests
                  </span>

                  <span className="text-[18px] sm:text-[20px] lg:text-[23px] font-normal text-[#0162D1]">
                    Matches Played
                  </span>
                </div>

                <div className="flex flex-col gap-[10px] sm:gap-[14px] w-full">
                  {entries.map((entry) => (
                    <RankingRow
                      key={
                        entry.robotId ??
                        entry.teamId
                      }
                      entry={entry}
                      onOpen={() =>
                        navigate(
                          entry.robotId
                            ? `/robot/${entry.robotId}`
                            : `/team/${entry.teamId}`,
                        )
                      }
                    />
                  ))}
                </div>
              </>
            )}

        </div>
      </main>
    </div>
  );
}

