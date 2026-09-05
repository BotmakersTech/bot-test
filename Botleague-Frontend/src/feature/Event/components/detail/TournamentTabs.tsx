import { useState } from "react";
import type { ReactNode } from "react";

export type TournamentTabId = "matches" | "rankings" | "schedule" | "registration" | "lineup";

const DESKTOP_TABS: { id: TournamentTabId; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "rankings", label: "Leaderboard" },
  { id: "schedule", label: "Schedule" },
  { id: "registration", label: "Register" },
  { id: "lineup", label: "Lineup" },
];

const MOBILE_TABS: { id: TournamentTabId; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "rankings", label: "Leaderboard" },
  { id: "schedule", label: "Schedule" },
];

interface TournamentTabsProps {
  matches: ReactNode;
  rankings: ReactNode;
  schedule: ReactNode;
  registration: ReactNode;
  lineup: ReactNode;
  /** True once the user is authenticated. Gates the Lineup tab on desktop —
   * a signed-out visitor has no team to manage, so Lineup only appears
   * once they're logged in (registration flips this too, since you can't
   * register without being logged in). */
  isLoggedIn: boolean;
  /** Mobile/tablet only. Register and Lineup collapse into a single CTA
   * instead of two more tab pills — before registering there's nothing to
   * manage yet, so the button reads "Register"; once the team is in, the
   * same slot becomes "Lineup" instead of leaving a now-pointless Register
   * button around. Desktop is unaffected by this collapsing — it keeps
   * both as separate tabs — but Lineup itself is still gated by isLoggedIn. */
  isRegistered: boolean;
}

export default function TournamentTabs({
  matches,
  rankings,
  schedule,
  registration,
  lineup,
  isLoggedIn,
  isRegistered,
}: TournamentTabsProps) {
  const [activeTab, setActiveTab] = useState<TournamentTabId>("matches");

  // The moment registration succeeds mid-flow, jump straight to Lineup
  // instead of leaving the viewer parked on the registration form's own
  // success state, waiting to notice the button relabeled — that's the
  // "seamless" part: register flows straight into managing your lineup,
  // no extra tap. Derived-during-render (not an effect) so it takes effect
  // on the same render the prop flips, same pattern as ProfilePage's own
  // saveSuccess-driven mode switch.
  const [prevIsRegistered, setPrevIsRegistered] = useState(isRegistered);
  if (isRegistered !== prevIsRegistered) {
    setPrevIsRegistered(isRegistered);
    if (isRegistered && activeTab === "registration") {
      setActiveTab("lineup");
    }
  }

  // If the viewer signs out (or their session lapses) while sitting on the
  // Lineup tab, that tab is about to disappear from the bar — bounce back
  // to Matches instead of leaving activeTab pointing at a hidden pill.
  const canSeeLineup = isLoggedIn || isRegistered;
  const [prevCanSeeLineup, setPrevCanSeeLineup] = useState(canSeeLineup);
  if (canSeeLineup !== prevCanSeeLineup) {
    setPrevCanSeeLineup(canSeeLineup);
    if (!canSeeLineup && activeTab === "lineup") {
      setActiveTab("matches");
    }
  }

  const content: Record<TournamentTabId, ReactNode> = {
    matches,
    rankings,
    schedule,
    registration,
    lineup,
  };

  // Desktop tab list, filtered: Lineup only shows once logged in / registered.
  const visibleDesktopTabs = DESKTOP_TABS.filter(
    (tab) => tab.id !== "lineup" || canSeeLineup
  );

  const mobileActionTab: TournamentTabId = isRegistered ? "lineup" : "registration";
  const isMobileActionActive = activeTab === mobileActionTab;

  return (
    <section className="tournament">
      {/* Desktop (>992px) — 4 tabs when signed out, 5 once logged in/registered. */}
      <div className="tabs tabs-desktop">
        {visibleDesktopTabs.map((tab) => (
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

      {/* Mobile/tablet (<=992px) — 3 content tabs + one Register/Lineup CTA. */}
      <div className="tabs-mobile-wrap">
        <div className="tabs-mobile">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={!isMobileActionActive && activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={isMobileActionActive ? "tournament-action-btn active" : "tournament-action-btn"}
          onClick={() => setActiveTab(mobileActionTab)}
        >
          {isRegistered ? "Lineup" : "Register"}
        </button>
      </div>

      {content[activeTab]}
    </section>
  );
}