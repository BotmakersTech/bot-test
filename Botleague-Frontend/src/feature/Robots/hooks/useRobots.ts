import { useCallback, useEffect, useState } from "react";

import {
  getRobotsOfCurrentTeam,
} from "../api/robot.api";

import type { Robot } from "../types/types";


export default function useRobots(
  teamCode?: string
) {

  const [robots, setRobots] =
    useState<Robot[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  // ─────────────────────────────────────────────
  // Fetch Robots
  // ─────────────────────────────────────────────
  const fetchRobots = useCallback(async () => {

    // Prevent API call if no teamCode
    if (!teamCode) {

      setRobots([]);
      setLoading(false);

      return;
    }

    try {

      setLoading(true);

      setError(null);

      const response =
        await getRobotsOfCurrentTeam(
          teamCode
        );

      setRobots(response || []);

    } catch (err: any) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        "Failed to fetch robots"
      );

    } finally {

      setLoading(false);
    }

  }, [teamCode]);


  // ─────────────────────────────────────────────
  // Auto Fetch on teamCode change
  // ─────────────────────────────────────────────
  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRobots();

  }, [fetchRobots]);


  // ─────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────
  return {

    robots,
    loading,
    error,
    fetchRobots,

  };
}