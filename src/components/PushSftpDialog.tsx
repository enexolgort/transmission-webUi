import { useState } from "react";
import { Modal } from "./Modal";
import type { Torrent } from "../types";

interface Destination {
  label: string;
  remoteFolder: string;
}

const DESTINATIONS: Destination[] = [
  { label: "Movies", remoteFolder: "/upload/Movies" },
  { label: "Music", remoteFolder: "/upload/Music" },
];

interface Props {
  torrent: Torrent;
  onClose: () => void;
  onPush: (remoteFolder: string) => Promise<void>;
}

export function PushSftpDialog({ torrent, onClose, onPush }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handlePush(remoteFolder: string) {
    setBusy(remoteFolder);
    setErrorMsg(null);
    try {
      await onPush(remoteFolder);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
      setBusy(null);
    }
  }

  return (
    <Modal title="Push to remote" onClose={onClose}>
      <p className="muted">
        Send <strong>{torrent.name}</strong> to a folder on your SFTP remote.
      </p>
      <div className="destination-list">
        {DESTINATIONS.map((d) => (
          <button
            key={d.remoteFolder}
            type="button"
            className="destination-button"
            disabled={busy !== null}
            onClick={() => handlePush(d.remoteFolder)}
          >
            <span className="destination-button__label">{d.label}</span>
            <span className="destination-button__path mono">{d.remoteFolder}</span>
            <span className="destination-button__status">
              {busy === d.remoteFolder ? "Pushing\u2026" : "\u2192"}
            </span>
          </button>
        ))}
      </div>
      {errorMsg && <p className="form-error">{errorMsg}</p>}
    </Modal>
  );
}