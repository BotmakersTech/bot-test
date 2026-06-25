// ======================================================
// useLeaderboard.ts
// Hook for fetching leaderboard data
// Place alongside your useMatches hook
// ======================================================

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  getLeaderboard,
  type LeaderboardResponseDTO,
} from "../api/leaderboard.api";
import { selectRankingsRefreshTrigger } from "../../Matches/store/matchesSlice";
import type { RootState } from "../../../app/store";

interface UseLeaderboardResult {
  leaderboard:  LeaderboardResponseDTO | null;
  loading:      boolean;
  error:        string | null;
  refetch:      () => void;
}

export default function useLeaderboard(
  eventId: string,
  sportId: string
): UseLeaderboardResult {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponseDTO | null>(null);
  const [loading, setLoading]         = useState<boolean>(false);
  const [error, setError]             = useState<string | null>(null);

  const rankingsRefreshTrigger = useSelector((s: RootState) =>
    selectRankingsRefreshTrigger(s)
  );

  const fetch = useCallback(async () => {
    if (!eventId || !sportId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(eventId, sportId);
      setLeaderboard(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ??
        err?.message ??
        "Failed to load leaderboard."
      );
    } finally {
      setLoading(false);
    }
  }, [eventId, sportId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Re-fetch when a RANKINGS_UPDATED websocket event fires for this sport
  useEffect(() => {
    if (!rankingsRefreshTrigger) return;
    const [triggeredSportId] = rankingsRefreshTrigger.split(":");
    if (triggeredSportId === sportId) {
      fetch();
    }
  }, [rankingsRefreshTrigger, sportId, fetch]);

  return { leaderboard, loading, error, refetch: fetch };
}