import { useCallback, useEffect, useState } from "react";
import {
  getMyReadiness,
  updateMyReadiness,
  type ReadinessDTO,
  type UpdateReadinessRequest,
} from "../api/playerReadiness.api";

interface UsePlayerReadinessResult {
  readiness: ReadinessDTO | null;
  loading: boolean;
  error: string | null;
  update: (req: UpdateReadinessRequest) => Promise<void>;
}

export function usePlayerReadiness(matchId: string): UsePlayerReadinessResult {
  const [readiness, setReadiness] = useState<ReadinessDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMyReadiness(matchId)
      .then((data) => {
        if (!cancelled) setReadiness(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load readiness");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const update = useCallback(
    async (req: UpdateReadinessRequest) => {
      const updated = await updateMyReadiness(matchId, req);
      setReadiness(updated);
    },
    [matchId]
  );

  return { readiness, loading, error, update };
}
