import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMatchesByEventSport } from "../store/matchesSlice";
import type { RootState } from "../../../app/store";
import type { PublicMatchView } from "../api/matches.api";

/**
 * Fetches and returns matches for a sport competition.
 * Reads from the Redux store so that WebSocket-pushed `updateMatchRealtime`
 * dispatches automatically refresh the UI without polling.
 */
const useMatches = (eventSportId?: string) => {
  const dispatch = useDispatch();

  const matches = useSelector(
    (s: RootState): PublicMatchView[] =>
      eventSportId ? (s.matches.matchesByEventSport[eventSportId] ?? []) : []
  );
  const loading = useSelector((s: RootState) => s.matches.loading);
  const error   = useSelector((s: RootState) => s.matches.error);

  const fetchMatches = useCallback(() => {
    if (eventSportId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dispatch as any)(fetchMatchesByEventSport(eventSportId));
    }
  }, [dispatch, eventSportId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, loading, error, refetch: fetchMatches };
};

export default useMatches;
