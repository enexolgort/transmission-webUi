import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { ApiClient } from "./api";
import { loadSettings, saveSettings, type Settings } from "./settings";

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (next: Settings) => void;
  api: ApiClient;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const updateSettings = useCallback((next: Settings) => {
    saveSettings(next);
    setSettings(loadSettings());
  }, []);

  const api = useMemo(() => new ApiClient(settings), [settings]);

  const value = useMemo(
    () => ({ settings, updateSettings, api }),
    [settings, updateSettings, api],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
