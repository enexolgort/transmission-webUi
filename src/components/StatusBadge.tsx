import type { Torrent } from "../types";
import { getStatusMeta } from "../lib/format";

export function StatusBadge({ torrent }: { torrent: Torrent }) {
  const meta = getStatusMeta(torrent.status);
  const hasError = Boolean(torrent.error) && torrent.errorString;

  return (
    <span
      className={`status-badge${meta.animated ? " status-badge--animated" : ""}${hasError ? " status-badge--error" : ""}`}
      style={{ ["--dot-color" as string]: `var(${meta.colorVar})` }}
      title={hasError ? torrent.errorString : undefined}
    >
      <span className="status-badge__dot" />
      {hasError ? "Error" : meta.label}
    </span>
  );
}
