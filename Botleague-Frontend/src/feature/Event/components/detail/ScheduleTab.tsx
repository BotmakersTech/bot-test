import type { PublicMatchView } from "../../../Matches/api/matches.api";
import BracketGraphView from "./BracketGraphView";

interface ScheduleTabProps {
  matches: PublicMatchView[];
  loading: boolean;
  error: string | null;
  sportLabel: string;
}

// Same connected-bracket graph the admin bracket page renders — view-only
// (pan/zoom to explore, no click-to-score) — replacing the old flat
// round-by-round match list.
export default function ScheduleTab({ matches, loading, error, sportLabel }: ScheduleTabProps) {
  return (
    <div className="schedule-page">
      <div className="schedule-title">
        <h2>{sportLabel} Schedule</h2>
        <p>Full tournament bracket and results.</p>
      </div>

      <BracketGraphView matches={matches} loading={loading} error={error} />
    </div>
  );
}
