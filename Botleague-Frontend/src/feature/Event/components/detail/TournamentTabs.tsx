import { useState } from "react";
import type { ReactNode } from "react";

export type TournamentTabId = "matches" | "rankings" | "schedule" | "registration" | "lineup";

const TABS: { id: TournamentTabId; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "rankings", label: "Leaderboard" },
  { id: "schedule", label: "Schedule" },
  { id: "registration", label: "Register" },
  { id: "lineup", label: "Lineup" },
];

interface TournamentTabsProps {
  matches: ReactNode;
  rankings: ReactNode;
  schedule: ReactNode;
  registration: ReactNode;
  lineup: ReactNode;
}

export default function TournamentTabs({ matches, rankings, schedule, registration, lineup }: TournamentTabsProps) {
  const [activeTab, setActiveTab] = useState<TournamentTabId>("matches");

  const content: Record<TournamentTabId, ReactNode> = {
    matches,
    rankings,
    schedule,
    registration,
    lineup,
  };

  return (
    <section className="tournament">
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {content[activeTab]}
    </section>
  );
}
