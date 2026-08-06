import { useRef, useState } from "react";
import { Modal } from "./Modal";
import { useSettings } from "../lib/SettingsContext";
import { useToast } from "../lib/ToastContext";
import type { AddTorrentRequest } from "../types";

type Source = "magnet" | "url" | "file";

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:application/x-bittorrent;base64," prefix
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function AddTorrentDialog({ onClose, onAdded }: Props) {
  const { api } = useSettings();
  const { notify } = useToast();
  const [source, setSource] = useState<Source>("magnet");
  const [magnet, setMagnet] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [downloadDir, setDownloadDir] = useState("");
  const [paused, setPaused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    (source === "magnet" && magnet.trim().length > 0) ||
    (source === "url" && url.trim().length > 0) ||
    (source === "file" && file !== null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload: AddTorrentRequest = {
        ...(downloadDir.trim() ? { downloadDir: downloadDir.trim() } : {}),
        ...(paused ? { paused: true } : {}),
      };
      if (source === "magnet") payload.magnet = magnet.trim();
      if (source === "url") payload.url = url.trim();
      if (source === "file" && file) payload.metainfo = await fileToBase64(file);

      const res = await api.addTorrent(payload);
      notify(
        res.duplicate
          ? `Already added: ${res.torrent?.name ?? "torrent"}`
          : `Added: ${res.torrent?.name ?? "torrent"}`,
        "success",
      );
      onAdded();
      onClose();
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add torrent" onClose={onClose}>
      <form onSubmit={handleSubmit} className="add-torrent-form">
        <div className="tab-strip" role="tablist">
          {(["magnet", "url", "file"] as Source[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={source === s}
              className={`tab-strip__tab${source === s ? " tab-strip__tab--active" : ""}`}
              onClick={() => setSource(s)}
            >
              {s === "magnet" ? "Magnet link" : s === "url" ? ".torrent URL" : "Upload file"}
            </button>
          ))}
        </div>

        {source === "magnet" && (
          <label className="field">
            <span>Magnet link</span>
            <input
              type="text"
              placeholder="magnet:?xt=urn:btih:..."
              value={magnet}
              onChange={(e) => setMagnet(e.target.value)}
              autoFocus
            />
          </label>
        )}

        {source === "url" && (
          <label className="field">
            <span>.torrent file URL</span>
            <input
              type="text"
              placeholder="https://example.com/file.torrent"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </label>
        )}

        {source === "file" && (
          <label className="field">
            <span>.torrent file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".torrent"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        <label className="field">
          <span>Download directory (optional)</span>
          <input
            type="text"
            placeholder="Leave blank to use the daemon default"
            value={downloadDir}
            onChange={(e) => setDownloadDir(e.target.value)}
          />
        </label>

        <label className="field field--checkbox">
          <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
          <span>Add paused (don't start downloading immediately)</span>
        </label>

        <div className="modal__footer">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={!canSubmit || submitting}>
            {submitting ? "Adding\u2026" : "Add torrent"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
