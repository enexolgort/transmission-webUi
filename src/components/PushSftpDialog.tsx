import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { useSettings } from "../lib/SettingsContext";
import { useToast } from "../lib/ToastContext";
import { formatBytes } from "../lib/format";
import type { Torrent, TransferJob } from "../types";

interface Destination {
  label: string;
  remoteFolder: string;
}

const DESTINATIONS: Destination[] = [
  { label: "Movies", remoteFolder: "/upload/Movies" },
  { label: "Music", remoteFolder: "/upload/Music" },
];

const POLL_MS = 1000;

interface Props {
  torrent: Torrent;
  onClose: () => void;
}

export function PushSftpDialog({ torrent, onClose }: Props) {
  const { api } = useSettings();
  const { notify } = useToast();
  const [starting, setStarting] = useState<string | null>(null); // remoteFolder being started
  const [startError, setStartError] = useState<string | null>(null);
  const [job, setJob] = useState<TransferJob | null>(null);
  const pollRef = useRef<number | null>(null);
  const notifiedRef = useRef(false);

  // Stop polling if the dialog unmounts -- the server-side job keeps
  // running regardless (it's a background job independent of this dialog),
  // this just stops us from updating state on an unmounted component.
  useEffect(() => {
    return () => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
    };
  }, []);

  async function startPush(remoteFolder: string) {
    setStarting(remoteFolder);
    setStartError(null);
    try {
      const accepted = await api.pushToSftp(torrent.id, remoteFolder);
      // Seed local state immediately so the progress view appears right
      // away, before the first poll response comes back.
      setJob({
        id: accepted.jobId,
        torrentId: accepted.torrentId,
        remoteFolder: accepted.remoteFolder,
        localPath: accepted.localPath,
        status: "pending",
        bytesTransferred: 0,
        totalBytes: 0,
        startedAt: new Date().toISOString(),
      });

      pollRef.current = window.setInterval(async () => {
        try {
          const res = await api.getTransfer(accepted.jobId);
          setJob(res.transfer);
          if (res.transfer.status === "completed" || res.transfer.status === "failed") {
            if (pollRef.current !== null) {
              window.clearInterval(pollRef.current);
              pollRef.current = null;
            }
            if (!notifiedRef.current) {
              notifiedRef.current = true;
              if (res.transfer.status === "completed") {
                notify(`Pushed "${torrent.name}" to ${res.transfer.remoteFolder}`, "success");
              } else {
                notify(`Push failed: ${res.transfer.error ?? "unknown error"}`);
              }
            }
          }
        } catch {
          // A transient poll failure shouldn't kill the whole flow --
          // just try again on the next tick instead of surfacing every blip.
        }
      }, POLL_MS);
    } catch (err) {
      setStartError((err as Error).message);
      setStarting(null);
    }
  }

  const pct = job && job.totalBytes > 0 ? Math.min(1, job.bytesTransferred / job.totalBytes) : 0;
  const isDone = job?.status === "completed";
  const isFailed = job?.status === "failed";
  const isActive = Boolean(job) && !isDone && !isFailed;

  return (
    <Modal title="Push to remote" onClose={onClose}>
      {!job && (
        <>
          <p className="muted">
            Send <strong>{torrent.name}</strong> to a folder on your SFTP remote.
          </p>
          <div className="destination-list">
            {DESTINATIONS.map((d) => (
              <button
                key={d.remoteFolder}
                type="button"
                className="destination-button"
                disabled={starting !== null}
                onClick={() => startPush(d.remoteFolder)}
              >
                <span className="destination-button__label">{d.label}</span>
                <span className="destination-button__path mono">{d.remoteFolder}</span>
                <span className="destination-button__status">
                  {starting === d.remoteFolder ? "Starting\u2026" : "\u2192"}
                </span>
              </button>
            ))}
          </div>
          {startError && <p className="form-error">{startError}</p>}
        </>
      )}

      {job && (
        <div className="transfer-progress">
          <div className="transfer-progress__header">
            <span className="transfer-progress__folder mono">{job.remoteFolder}</span>
            <span className={`transfer-status transfer-status--${job.status}`}>
              {job.status === "pending" && "Starting\u2026"}
              {job.status === "uploading" && "Uploading\u2026"}
              {job.status === "completed" && "Done"}
              {job.status === "failed" && "Failed"}
            </span>
          </div>

          <div
            className="progress progress--large"
            role="progressbar"
            aria-valuenow={Math.round(pct * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`progress__fill progress__fill--transfer${isActive ? " progress__fill--active" : ""}${isDone ? " progress__fill--done" : ""}${isFailed ? " progress__fill--failed" : ""}`}
              style={{ width: `${pct * 100}%` }}
            />
            <span className="progress__label">{job.totalBytes > 0 ? `${Math.round(pct * 100)}%` : "\u2026"}</span>
          </div>

          <div className="transfer-progress__meta mono">
            {formatBytes(job.bytesTransferred)}
            {job.totalBytes > 0 ? ` / ${formatBytes(job.totalBytes)}` : ""}
            {job.currentFile ? ` ${"\u00b7"} ${job.currentFile}` : ""}
          </div>

          {isFailed && job.error && <p className="form-error">{job.error}</p>}

          <div className="modal__footer">
            {isDone || isFailed ? (
              <button type="button" className="button button--primary" onClick={onClose}>
                Close
              </button>
            ) : (
              <button type="button" className="button button--ghost" onClick={onClose}>
                Run in background
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}