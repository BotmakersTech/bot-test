import robotFallback from "../../../assets/robot.png";

// Same hand-drawn icon set as TeamBuildEmptyState/MyTeamEmptyState's stat
// row, reused here so every "you haven't set this up yet" state in the
// Team/Robots area reads as one design language across breakpoints.
function BotStatIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="9" width="14" height="10" rx="2" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 3v1.5" />
    </svg>
  );
}
function BoltStatIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 L4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}
function RankStatIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="13" width="3.5" height="7" rx="1" />
      <rect x="10.25" y="9" width="3.5" height="11" rx="1" />
      <rect x="16.5" y="5" width="3.5" height="15" rx="1" />
    </svg>
  );
}
function ShieldStatIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 h-[72px] rounded-[5px] border border-[#0162D1] bg-white px-2.5">
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[5px] bg-[#F1F2F6] text-[#0162D1]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="leading-none font-bold text-black text-[24px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {value}
        </div>
        <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

interface MobileRobotEmptyStateProps {
  /** "no-robots": on a team, but the team hasn't added a robot yet.
   *  "no-team": not part of any team yet. */
  mode: "no-robots" | "no-team";
  /** "no-robots" mode only — captain/vice-captain gets the create CTA,
   *  everyone else just sees the "ask your captain" line. */
  canManageRobots?: boolean;
  onCreateRobot?: () => void;
  onCreateTeam?: () => void;
}

export default function MobileRobotEmptyState({
  mode,
  canManageRobots = false,
  onCreateRobot,
  onCreateTeam,
}: MobileRobotEmptyStateProps) {
  const isNoTeam = mode === "no-team";
  const showCta = isNoTeam || canManageRobots;

  return (
    <div className="px-1 py-2">
      <h1
        className="m-0 mb-4 text-[clamp(20px,4vw,38px)] font-bold"
        style={{ fontFamily: "Orbitron, sans-serif", color: "#0162D1" }}
      >
        Team Build
      </h1>

      {/* Stats are always the zero-state here — both "no team" and "team
          with no robots yet" mean 0 robots/matches by definition, and no
          per-team ranking source exists yet (see MobileRobotBuild). */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <StatCard value={0} label="Total Robots" icon={<BotStatIcon />} />
        <StatCard value={0} label="Active Robots" icon={<BoltStatIcon />} />
        <StatCard value="--" label="Team Ranking" icon={<RankStatIcon />} />
        <StatCard value={0} label="Matches Played" icon={<ShieldStatIcon />} />
      </div>

      <div className="flex flex-col items-center rounded-[8px] border border-[#0162D1] px-5 pt-4 pb-6 text-center">
        <div className="w-full max-w-[349px] aspect-[349/232] rounded-[5px] overflow-hidden bg-[#D9D9D9]">
          <img src={robotFallback} alt="" className="h-full w-full object-cover" />
        </div>

        <h2
          className="mt-5 mb-2.5 text-[24px] font-bold"
          style={{
            fontFamily: "Poppins, sans-serif",
            background: "linear-gradient(90.11deg, #8C6CFF 0.06%, #0162D1 62.1%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {isNoTeam ? "Assemble Your BotCrew Now!" : "Add Your Robot"}
        </h2>

        <p className="m-0 mb-5 max-w-[282px] text-[12px] leading-[18px] text-black">
          {isNoTeam
            ? "Join or create your first team and participate in exciting BotLeague competitions."
            : canManageRobots
              ? "Create your first robot and participate in exciting BotLeague competitions."
              : "Your team hasn't added a robot yet. Ask your captain to add one so you can join competitions."}
        </p>

        {showCta && (
          <button
            type="button"
            onClick={isNoTeam ? onCreateTeam : onCreateRobot}
            className="flex w-full max-w-[261px] items-center justify-center gap-2 rounded-[8px] py-2.5 text-[13px] font-bold uppercase tracking-wider text-white cursor-pointer"
            style={{
              background: "linear-gradient(180deg, rgba(140,108,255,0.75) 0%, rgba(1,98,209,0.75) 100%)",
              boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <span className="text-base leading-none">+</span>
            {isNoTeam ? "Create Your First Team" : "Create Your First Robot"}
          </button>
        )}

        {isNoTeam && (
          <p className="mt-4 mb-0 text-[12px] text-[#6c6c6c]">
            No team yet? Ask your captain to add you instead.
          </p>
        )}
      </div>
    </div>
  );
}
