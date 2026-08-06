import type { TorrentStatus } from "../types";

interface Props {
  percentDone: number; // 0..1
  status: TorrentStatus;
}

export function ProgressBar({ percentDone, status }: Props) {
  const pct = Math.max(0, Math.min(1, percentDone)) * 100;
  const active = status === 4; // Downloading
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`progress__fill${active ? " progress__fill--active" : ""} progress__fill--status-${status}`}
        style={{ width: `${pct}%` }}
      />
      <span className="progress__label">{pct.toFixed(pct < 100 ? 1 : 0)}%</span>
    </div>
  );
}
