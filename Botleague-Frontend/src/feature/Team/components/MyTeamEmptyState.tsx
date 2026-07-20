import teamDefaultImg from "../../../assets/TeamDefault.png";

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
      <div className="myteam-empty-stat-icon w-12 h-12 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-900 leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>{value}</div>
        <div className="text-[11px] font-bold tracking-wider text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

interface MyTeamEmptyStateProps {
  onCreateClick: () => void;
}

/**
 * Shown on /my-team instead of the team dashboard when the logged-in user
 * isn't part of any team yet. Mirrors TeamBuildEmptyState's zero-robots
 * layout so the two "you haven't set this up yet" states in the Team area
 * read as one design language.
 */
export default function MyTeamEmptyState({ onCreateClick }: MyTeamEmptyStateProps) {
  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">

      <OutlineStar className="myteam-empty-star absolute top-4 left-[42%] w-16 h-16 text-indigo-200 opacity-70" />
      <OutlineStar className="myteam-empty-star absolute top-[30%] right-[10%] w-16 h-16 text-indigo-200 opacity-70" />
      <OutlineStar className="myteam-empty-star absolute bottom-[14%] left-[10%] w-10 h-10 text-indigo-200 opacity-70" />
      <OutlineStar className="myteam-empty-star absolute bottom-[6%] right-[8%] w-20 h-20 text-indigo-200 opacity-60" />
      <OutlineStar className="myteam-empty-star absolute top-[30%] right-[24%] w-10 h-10 text-indigo-200 opacity-60" />

      <h1 className="myteam-empty-title text-3xl font-bold text-[#4F6EF7] tracking-wide mb-10">Team Dashboard</h1>

      <div className="flex flex-wrap gap-x-12 gap-y-6 mb-10">
        <StatItem
          value={0}
          label="TOTAL ROBOTS"
          icon={
            <svg className="w-5 h-5 text-[#4F6EF7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="8" width="16" height="12" rx="2" />
              <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
              <path d="M12 8V4M9 4h6" />
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
          value="--"
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

      <div className="myteam-empty-card rounded-[24px] p-8 flex flex-col md:flex-row gap-10 items-center bg-white relative overflow-hidden">
        <OutlineStar className="absolute top-6 right-10 w-10 h-10 text-indigo-100 opacity-80" />

        <div className="myteam-empty-art w-full md:w-[420px] h-[300px] rounded-2xl overflow-hidden flex-shrink-0">
          <img src={teamDefaultImg} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1">
          <h2 className="myteam-empty-gradient-text text-3xl md:text-[34px] font-bold leading-tight mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Assemble Your BotCrew Now!
          </h2>
          <p className="text-gray-700 text-base leading-relaxed mb-7 max-w-md">
            Join or create your first team and participate in exciting BotLeague competitions.
          </p>

          <button
            type="button"
            onClick={onCreateClick}
            className="myteam-empty-btn text-white font-bold text-sm tracking-wide uppercase px-7 py-4 rounded-full inline-flex items-center gap-2 hover:opacity-95 transition cursor-pointer"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <span className="text-lg leading-none">+</span> Create Your First Team
          </button>

          <p className="mt-4 text-[13px] text-gray-500">
            No team yet? Ask your captain to add you instead.
          </p>
        </div>
      </div>
    </div>
  );
}
