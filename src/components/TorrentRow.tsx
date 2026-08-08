import { useState } from "react";
import type { Torrent } from "../types";
import { formatBytes, formatEta, formatSpeed } from "../lib/format";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { SpeedLimitDialog } from "./SpeedLimitDialog";
import { PushSftpDialog } from "./PushSftpDialog";
import { ConfirmRemoveDialog } from "./ConfirmRemoveDialog";
import { useSettings } from "../lib/SettingsContext";
import { useToast } from "../lib/ToastContext";

interface Props {
  torrent: Torrent;
  onChanged: () => void;
}

export function TorrentRow({ torrent, onChanged }: Props) {
  const { api } = useSettings();
  const { notify } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [showSpeedLimit, setShowSpeedLimit] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [showRemove, setShowRemove] = useState(false);

  const isStopped = torrent.status === 0;

  async function run(action: string, fn: () => Promise<unknown>) {
    setBusy(action);
    try {
      await fn();
      onChanged();
    } catch (err) {
      notify(`${torrent.name}: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <tr className="torrent-row">
        <td className="torrent-row__name" title={torrent.name}>
          <div className="torrent-row__name-text">{torrent.name}</div>
          <div className="torrent-row__meta">
            {formatBytes(torrent.totalSize)} {"\u00b7"} {torrent.peersConnected} peer
            {torrent.peersConnected === 1 ? "" : "s"} {"\u00b7"} ratio {torrent.uploadRatio.toFixed(2)}
          </div>
        </td>
        <td className="torrent-row__progress">
          <ProgressBar percentDone={torrent.percentDone} status={torrent.status} />
        </td>
        <td className="torrent-row__status">
          <StatusBadge torrent={torrent} />
        </td>
        <td className="mono torrent-row__down">{formatSpeed(torrent.rateDownload)}</td>
        <td className="mono torrent-row__up">{formatSpeed(torrent.rateUpload)}</td>
        <td className="mono torrent-row__eta">{formatEta(torrent.eta)}</td>
        <td className="torrent-row__actions">
          {isStopped ? (
            <button
              className="icon-button"
              title="Start"
              disabled={busy !== null}
              onClick={() => run("start", () => api.startTorrent(torrent.id))}
            >
              {busy === "start" ? "\u2026" : "\u25B6"}
            </button>
          ) : (
            <button
              className="icon-button"
              title="Stop"
              disabled={busy !== null}
              onClick={() => run("stop", () => api.stopTorrent(torrent.id))}
            >
              {busy === "stop" ? "\u2026" : "\u23F8"}
            </button>
          )}
          <button
            className="icon-button"
            title="Verify"
            disabled={busy !== null}
            onClick={() => run("verify", () => api.verifyTorrent(torrent.id))}
          >
            {busy === "verify" ? "\u2026" : "\u21BB"}
          </button>
          {torrent.isFinished && (
            <button
              className="icon-button"
              title="Push to remote"
              disabled={busy !== null}
              onClick={() => setShowPush(true)}
            >
              {"\u21D1"}
            </button>
          )}
          <button
            className="icon-button"
            title="Speed limit"
            disabled={busy !== null}
            onClick={() => setShowSpeedLimit(true)}
          >
            {"\u21C5"}
          </button>
          <button
            className="icon-button icon-button--danger"
            title="Remove"
            disabled={busy !== null}
            onClick={() => setShowRemove(true)}
          >
            {"\u2715"}
          </button>
        </td>
      </tr>

      {showSpeedLimit && (
        <SpeedLimitDialog
          title={`Speed limit \u2014 ${torrent.name}`}
          description="Applies to this torrent only. Directions left unchanged keep their current value; 'No limit' falls back to the global session limit."
          onClose={() => setShowSpeedLimit(false)}
          onSubmit={async (limits) => {
            await api.setTorrentSpeedLimit(torrent.id, limits);
            notify("Speed limit updated", "success");
            onChanged();
          }}
        />
      )}

      {showPush && (
        <PushSftpDialog
          torrent={torrent}
          onClose={() => setShowPush(false)}
          onPush={async (remoteFolder) => {
            await api.pushToSftp(torrent.id, remoteFolder);
            notify(`Pushed "${torrent.name}" to ${remoteFolder}`, "success");
          }}
        />
      )}

      {showRemove && (
        <ConfirmRemoveDialog
          torrent={torrent}
          onClose={() => setShowRemove(false)}
          onConfirm={async (deleteLocalData) => {
            await api.removeTorrent(torrent.id, deleteLocalData);
            notify(`Removed ${torrent.name}`, "success");
            onChanged();
          }}
        />
      )}
    </>
  );
}