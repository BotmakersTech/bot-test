import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getEventLeaderboard, type EventLeaderboard } from "../../Rankings/api/rankings.api";
import { selectRankingsRefreshTrigger } from "../../Matches/store/matchesSlice";
import type { RootState } from "../../../app/store";

interface UseEventLeaderboardResult {
  leaderboard: EventLeaderboard | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Sport Detail's Leaderboard tab — deliberately the *global* points system
// (LeaderboardEntry.pointsEarned, same ledger that feeds Global Rankings'
// totalPoints: a fixed award per win, not the raw scored-points-for/against
// margin the old useLeaderboard()/getLeaderboard() pair exposed) so "Point"
// on this tab always means the same thing it does everywhere else in the app.
export default function useEventLeaderboard(eventSportId: string): UseEventLeaderboardResult {
  const [leaderboard, setLeaderboard] = useState<EventLeaderboard | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const rankingsRefreshTrigger = useSelector((s: RootState) => selectRankingsRefreshTrigger(s));

  const fetch = useCallback(async () => {
    if (!eventSportId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getEventLeaderboard(eventSportId);
      setLeaderboard(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [eventSportId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!rankingsRefreshTrigger) return;
    const [triggeredSportId] = rankingsRefreshTrigger.split(":");
    if (triggeredSportId === eventSportId) fetch();
  }, [rankingsRefreshTrigger, eventSportId, fetch]);

  return { leaderboard, loading, error, refetch: fetch };
}
