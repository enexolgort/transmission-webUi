import { useCallback, useEffect, useState } from "react";
import { useSettings } from "../lib/SettingsContext";
import type { SessionStats } from "../types";
import { useInterval } from "./useInterval";

const POLL_MS = 5000;

export function useStats() {
  const { api } = useSettings();
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api
      .getStats()
      .then((res) => {
        setStats(res.stats);
        setError(null);
      })
      .catch((err: Error) => setError(err.message));
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, POLL_MS);

  return { stats, error, refresh };
}
