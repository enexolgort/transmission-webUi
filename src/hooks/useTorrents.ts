import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "../lib/SettingsContext";
import type { Torrent } from "../types";
import { useInterval } from "./useInterval";

const POLL_MS = 3000;

interface UseTorrentsResult {
  torrents: Torrent[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTorrents(): UseTorrentsResult {
  const { api } = useSettings();
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    api
      .listTorrents()
      .then((res) => {
        setTorrents(res.torrents ?? []);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
        inFlight.current = false;
      });
  }, [api]);

  // Refresh immediately whenever the api client changes (e.g. settings edited).
  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  useInterval(refresh, POLL_MS);

  return { torrents, loading, error, refresh };
}
