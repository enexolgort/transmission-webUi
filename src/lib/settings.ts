const STORAGE_KEY = "transmission-ui:settings";

export interface Settings {
  baseUrl: string;
  apiKey: string;
}

const DEFAULTS: Settings = {
  baseUrl: "http://localhost:3000",
  apiKey: "",
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      baseUrl: typeof parsed.baseUrl === "string" && parsed.baseUrl ? parsed.baseUrl : DEFAULTS.baseUrl,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : DEFAULTS.apiKey,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(settings: Settings): void {
  // Trim trailing slash so we don't end up with double slashes when building URLs.
  const normalized: Settings = {
    baseUrl: settings.baseUrl.trim().replace(/\/+$/, "") || DEFAULTS.baseUrl,
    apiKey: settings.apiKey.trim(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}
