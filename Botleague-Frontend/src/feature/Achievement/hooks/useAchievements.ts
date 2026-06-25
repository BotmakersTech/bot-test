import { useEffect, useState } from "react";
import { getMyAchievements, type AchievementDTO } from "../api/achievement.api";

interface UseAchievementsResult {
  achievements: AchievementDTO[];
  loading: boolean;
  error: string | null;
}

export function useAchievements(): UseAchievementsResult {
  const [achievements, setAchievements] = useState<AchievementDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getMyAchievements()
      .then((data) => {
        if (!cancelled) setAchievements(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load achievements");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { achievements, loading, error };
}
