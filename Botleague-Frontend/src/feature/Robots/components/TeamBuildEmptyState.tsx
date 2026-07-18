import RobotBuildArt from "./RobotBuildArt";

const STAR_PATH = "M25.5 2 L31 18.5 L48.4 18.5 L34.4 29 L39.9 45.5 L25.5 35 L11.1 45.5 L16.6 29 L2.6 18.5 L20 18.5 Z";

function OutlineStar({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 51 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="robot-build-empty-stat-icon w-12 h-12 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-900 leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</div>
        <div className="text-[11px] font-bold tracking-wider text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

interface TeamBuildEmptyStateProps {
  canManageRobots: boolean;
  onCreateClick: () => void;
  teamRanking?: string;
}

/**
 * Shown instead of the robot list/carousel when a team has just been
 * created or joined and hasn't added a single robot yet. The create CTA
 * only renders for the captain/vice-captain — everyone else just sees the
 * same "nothing here yet" state without an action they're not allowed to take.
 */
export default function TeamBuildEmptyState({ canManageRobots, onCreateClick, teamRanking = "--" }: TeamBuildEmptyStateProps) {
  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">

      <OutlineStar className="robot-build-star absolute top-4 left-[42%] w-16 h-16 text-indigo-200 opacity-70" />
      <OutlineStar className="robot-build-star absolute top-[30%] right-[10%] w-16 h-16 text-indigo-200 opacity-70" />
      <OutlineStar className="robot-build-star absolute bottom-[14%] left-[10%] w-10 h-10 text-indigo-200 opacity-70" />
      <OutlineStar className="robot-build-star absolute bottom-[6%] right-[8%] w-20 h-20 text-indigo-200 opacity-60" />
      <OutlineStar className="robot-build-star absolute top-[30%] right-[24%] w-10 h-10 text-indigo-200 opacity-60" />

      <h1 className="robot-build-empty-title text-3xl font-bold text-[#4F6EF7] tracking-wide mb-10">Team Build</h1>

      <div className="flex flex-wrap gap-x-12 gap-y-6 mb-10">
        <StatItem
          value={0}
          label="TOTAL ROBOTS"
          icon={
            <svg className="w-5 h-5 text-[#4F6EF7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="9" width="14" height="10" rx="2" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
              <path d="M12 3v1.5" />
            </svg>
          }
        />
        <StatItem
          value={0}
          label="ACTIVE ROBOTS"
          icon={
            <svg className="w-5 h-5 text-[#4F6EF7]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2 L4 14h6l-1 8 9-12h-6z" />
            </svg>
          }
        />
        <StatItem
          value={teamRanking}
          label="TEAM RANKING"
          icon={
            <svg className="w-5 h-5 text-[#4F6EF7]" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="13" width="3.5" height="7" rx="1" />
              <rect x="10.25" y="9" width="3.5" height="11" rx="1" />
              <rect x="16.5" y="5" width="3.5" height="15" rx="1" />
            </svg>
          }
        />
        <StatItem
          value={0}
          label="MATCHES PLAYED"
          icon={
            <svg className="w-5 h-5 text-[#4F6EF7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          }
        />
      </div>

      <div className="robot-build-empty-card rounded-[24px] p-8 flex flex-col md:flex-row gap-10 items-center bg-white relative">
        <OutlineStar className="absolute top-6 right-10 w-10 h-10 text-indigo-100 opacity-80" />

        <RobotBuildArt />

        <div className="flex-1">
          <h2 className="robot-build-empty-gradient-text text-3xl md:text-[34px] font-bold leading-tight mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Add Your Robot
          </h2>
          <p className="text-gray-700 text-base leading-relaxed mb-7 max-w-md">
            {canManageRobots
              ? "Create your first robot and participate in exciting BotLeague competitions."
              : "Your team hasn't added a robot yet. Ask your captain to add one so you can join competitions."}
          </p>

          {canManageRobots && (
            <button
              type="button"
              onClick={onCreateClick}
              className="robot-build-empty-btn text-white font-bold text-sm tracking-wide uppercase px-7 py-4 rounded-full inline-flex items-center gap-2 hover:opacity-95 transition cursor-pointer"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <span className="text-lg leading-none">+</span> Create Your First Robot
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
