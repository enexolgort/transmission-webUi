import type { SessionStats } from "../types";
import { formatSpeed } from "../lib/format";

export function StatsBar({ stats }: { stats: SessionStats | null }) {
  if (!stats) return <div className="stats-bar stats-bar--empty">Connecting to session{"\u2026"}</div>;

  return (
    <div className="stats-bar">
      <div className="stats-bar__item">
        <span className="stats-bar__value stats-bar__value--down">{formatSpeed(stats.downloadSpeed)}</span>
        <span className="stats-bar__label">down</span>
      </div>
      <div className="stats-bar__item">
        <span className="stats-bar__value stats-bar__value--up">{formatSpeed(stats.uploadSpeed)}</span>
        <span className="stats-bar__label">up</span>
      </div>
      <div className="stats-bar__divider" />
      <div className="stats-bar__item">
        <span className="stats-bar__value">{stats.activeTorrentCount}</span>
        <span className="stats-bar__label">active</span>
      </div>
      <div className="stats-bar__item">
        <span className="stats-bar__value">{stats.pausedTorrentCount}</span>
        <span className="stats-bar__label">paused</span>
      </div>
      <div className="stats-bar__item">
        <span className="stats-bar__value">{stats.torrentCount}</span>
        <span className="stats-bar__label">total</span>
      </div>
    </div>
  );
}
