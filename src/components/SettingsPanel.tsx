import { useState } from "react";
import { useSettings } from "../lib/SettingsContext";
import { useToast } from "../lib/ToastContext";
import { useStats } from "../hooks/useStats";
import { formatBytes, formatDuration, formatSpeed } from "../lib/format";
import { SpeedLimitDialog } from "./SpeedLimitDialog";

export function SettingsPanel() {
  const { settings, updateSettings, api } = useSettings();
  const { notify } = useToast();
  const { stats, error, refresh } = useStats();

  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [testing, setTesting] = useState(false);
  const [showSpeedLimit, setShowSpeedLimit] = useState(false);

  const dirty = baseUrl !== settings.baseUrl || apiKey !== settings.apiKey;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({ baseUrl, apiKey });
    notify("Connection settings saved", "success");
  }

  async function handleTest() {
    setTesting(true);
    try {
      await api.health();
      notify("Connected successfully", "success");
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="settings-panel">
      <section className="card">
        <h2>Connection</h2>
        <p className="muted">
          Points this UI at your transmission-api instance. Stored locally in this browser, so each device on
          your Tailnet configures its own connection.
        </p>
        <form onSubmit={handleSave} className="settings-form">
          <label className="field">
            <span>API base URL</span>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </label>
          <label className="field">
            <span>API key (optional)</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Only needed if API_KEY is set on the server"
              autoComplete="off"
            />
          </label>
          <div className="settings-form__actions">
            <button type="button" className="button button--ghost" onClick={handleTest} disabled={testing}>
              {testing ? "Testing\u2026" : "Test connection"}
            </button>
            <button type="submit" className="button button--primary" disabled={!dirty}>
              Save
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card__header-row">
          <h2>Global speed limit</h2>
          <button className="button button--ghost" onClick={() => setShowSpeedLimit(true)}>
            Set limit
          </button>
        </div>
        <p className="muted">Applies daemon-wide to any torrent without its own per-torrent override.</p>
      </section>

      <section className="card">
        <div className="card__header-row">
          <h2>Session stats</h2>
          <button className="button button--ghost" onClick={refresh}>
            Refresh
          </button>
        </div>
        {error && <div className="banner banner--error">{error}</div>}
        {stats && (
          <div className="stats-grid">
            <div className="stats-grid__group">
              <h3>Right now</h3>
              <dl>
                <div>
                  <dt>Download speed</dt>
                  <dd>{formatSpeed(stats.downloadSpeed)}</dd>
                </div>
                <div>
                  <dt>Upload speed</dt>
                  <dd>{formatSpeed(stats.uploadSpeed)}</dd>
                </div>
                <div>
                  <dt>Active</dt>
                  <dd>{stats.activeTorrentCount}</dd>
                </div>
                <div>
                  <dt>Paused</dt>
                  <dd>{stats.pausedTorrentCount}</dd>
                </div>
                <div>
                  <dt>Total torrents</dt>
                  <dd>{stats.torrentCount}</dd>
                </div>
              </dl>
            </div>

            <div className="stats-grid__group">
              <h3>This session</h3>
              <dl>
                <div>
                  <dt>Downloaded</dt>
                  <dd>{formatBytes(stats["current-stats"].downloadedBytes)}</dd>
                </div>
                <div>
                  <dt>Uploaded</dt>
                  <dd>{formatBytes(stats["current-stats"].uploadedBytes)}</dd>
                </div>
                <div>
                  <dt>Active time</dt>
                  <dd>{formatDuration(stats["current-stats"].secondsActive)}</dd>
                </div>
              </dl>
            </div>

            <div className="stats-grid__group">
              <h3>All time</h3>
              <dl>
                <div>
                  <dt>Downloaded</dt>
                  <dd>{formatBytes(stats["cumulative-stats"].downloadedBytes)}</dd>
                </div>
                <div>
                  <dt>Uploaded</dt>
                  <dd>{formatBytes(stats["cumulative-stats"].uploadedBytes)}</dd>
                </div>
                <div>
                  <dt>Active time</dt>
                  <dd>{formatDuration(stats["cumulative-stats"].secondsActive)}</dd>
                </div>
                <div>
                  <dt>Sessions</dt>
                  <dd>{stats["cumulative-stats"].sessionCount}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </section>

      {showSpeedLimit && (
        <SpeedLimitDialog
          title="Global speed limit"
          description="Directions left unchanged keep their current value; 'No limit' means unlimited."
          onClose={() => setShowSpeedLimit(false)}
          onSubmit={async (limits) => {
            await api.setGlobalSpeedLimit(limits);
            notify("Global speed limit updated", "success");
          }}
        />
      )}
    </div>
  );
}
