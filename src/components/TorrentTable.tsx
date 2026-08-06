import { useMemo, useState } from "react";
import type { Torrent } from "../types";
import { TorrentRow } from "./TorrentRow";

interface Props {
  torrents: Torrent[];
  loading: boolean;
  error: string | null;
  onChanged: () => void;
  onAddClick: () => void;
}

const STATUS_ORDER: Record<number, number> = {
  4: 0, // Downloading first
  2: 1, // Verifying
  1: 2,
  3: 2,
  5: 3,
  6: 4, // Seeding
  0: 5, // Stopped last
};

export function TorrentTable({ torrents, loading, error, onChanged, onAddClick }: Props) {
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle ? torrents.filter((t) => t.name.toLowerCase().includes(needle)) : torrents;
    return [...filtered].sort((a, b) => {
      const orderDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    });
  }, [torrents, filter]);

  return (
    <div className="torrent-table-wrap">
      <div className="torrent-table-toolbar">
        <input
          type="search"
          placeholder={"Filter by name\u2026"}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
          aria-label="Filter torrents by name"
        />
        <span className="torrent-count">
          {torrents.length} torrent{torrents.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="banner banner--error">
          Couldn't reach the API: {error}
        </div>
      )}

      {!error && loading && torrents.length === 0 && <div className="empty-state">Loading torrents{"\u2026"}</div>}

      {!error && !loading && torrents.length === 0 && (
        <div className="empty-state">
          <p>No torrents yet.</p>
          <button className="button button--primary" onClick={onAddClick}>
            Add your first torrent
          </button>
        </div>
      )}

      {!error && torrents.length > 0 && visible.length === 0 && (
        <div className="empty-state">No torrents match "{filter}".</div>
      )}

      {visible.length > 0 && (
        <table className="torrent-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Down</th>
              <th>Up</th>
              <th>ETA</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <TorrentRow key={t.id} torrent={t} onChanged={onChanged} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
