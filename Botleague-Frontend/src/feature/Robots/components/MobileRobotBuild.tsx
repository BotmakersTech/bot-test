import { Plus } from "lucide-react";
import type { Robot } from "../types/types";

type FilterKey = "ALL" | "ACTIVE" | "INACTIVE";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "INACTIVE", label: "Inactive" },
];

// Same hand-drawn icon set as TeamBuildEmptyState's stat row, reused here so
// the empty state and the populated list read as the same page.
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
        <div
          className="leading-none font-bold text-black truncate text-[24px]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {value}
        </div>
        <div
          className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-[#9ca3af] leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

interface MobileRobotBuildProps {
  robots: Robot[];
  visibleRobots: Robot[];
  filter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  canManageRobots: boolean;
  onAddRobot: () => void;
  onOpenRobot: (robotId: string) => void;
  getRobotImage: (robot?: Robot) => string;
  getWeight: (robot: Robot) => string;
  toLabel: (value?: string | null) => string;
}

export default function MobileRobotBuild({
  robots,
  visibleRobots,
  filter,
  onFilterChange,
  canManageRobots,
  onAddRobot,
  onOpenRobot,
  getRobotImage,
  getWeight,
  toLabel,
}: MobileRobotBuildProps) {
  const activeCount = robots.filter((r) => r.status === "ACTIVE").length;

  return (
    <div className="px-1 py-2">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1
          className="m-0 text-[clamp(20px,4vw,38px)] font-medium"
          style={{ fontFamily: "Orbitron, sans-serif", color: "#0162D1" }}
        >
          Team Build
        </h1>
        {canManageRobots && (
          <button
            type="button"
            onClick={onAddRobot}
            className="flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-2 text-[12px] font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, #5d8de8, #9a6cff)" }}
          >
            <Plus size={14} />
            Add Robot
          </button>
        )}
      </div>

      {/* Team-wide stats — Total/Active Robots come from this team's live
          roster; Team Ranking and Matches Played have no per-team aggregate
          data source yet (rankings are queried per sport/age-group pool, not
          per team), so they show the same "--" placeholder TeamBuildEmptyState
          already uses rather than a fabricated number. */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <StatCard value={robots.length} label="Total Robots" icon={<BotStatIcon />} />
        <StatCard value={activeCount} label="Active Robots" icon={<BoltStatIcon />} />
        <StatCard value="--" label="Team Ranking" icon={<RankStatIcon />} />
        <StatCard value="--" label="Matches Played" icon={<ShieldStatIcon />} />
      </div>

      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFilterChange(f.key)}
            className="flex-1 rounded-[8px] border px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors"
            style={
              filter === f.key
                ? { border: "1px solid transparent", background: "linear-gradient(135deg, #0162D1, #8C6CFF)", color: "#fff" }
                : { border: "1px solid #0162D1", background: "#fff", color: "#5b5b5b" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {visibleRobots.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-[#7c66ff]/50 py-10 px-4 text-center">
          <p className="m-0 text-[14px] text-[#6c6c6c]">No robots found. Try another filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleRobots.map((robot) => {
            const active = robot.status === "ACTIVE";
            return (
              <div
                key={robot.id}
                className="relative flex gap-4 rounded-[8px] border p-3"
                style={{ borderColor: "#0162D1", boxShadow: "0 4px 4px rgba(0,0,0,0.15)" }}
              >
                <img
                  className="h-[112px] w-[100px] shrink-0 rounded-[5px] object-cover bg-[#d9d9d9]"
                  src={getRobotImage(robot)}
                  alt={robot.robotName}
                />

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <div
                    className="truncate text-[20px] font-medium"
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      background: "linear-gradient(90deg, #8C6CFF 0%, #0162D1 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {robot.robotName}
                  </div>
                  <div className="text-[13px]">
                    <span className="text-[#a2a2a2]">BotID - </span>
                    <span className="font-semibold text-[#4d4d4d]">{robot.robotCode || "-"}</span>
                  </div>
                  <div className="text-[13px]">
                    <span className="text-[#a2a2a2]">Weight - </span>
                    <span className="font-semibold text-[#4d4d4d]">{getWeight(robot)}</span>
                  </div>
                  <div className="text-[13px]">
                    <span className="text-[#a2a2a2]">Sports - </span>
                    <span className="font-semibold text-[#4d4d4d]">{toLabel(robot.sport)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenRobot(robot.id)}
                    className="mt-1 w-fit text-[12px] font-bold text-[#0162D1] cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>

                <span
                  className="absolute right-3 top-3 flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
                  style={{ borderColor: active ? "#25d64a" : "#c2c2c2", color: active ? "#0ebf31" : "#7e7e7e" }}
                >
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: "currentColor" }} />
                  {active ? "Active" : "Inactive"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
