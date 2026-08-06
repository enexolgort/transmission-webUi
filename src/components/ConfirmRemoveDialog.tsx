import { useState } from "react";
import { Modal } from "./Modal";
import type { Torrent } from "../types";

interface Props {
  torrent: Torrent;
  onClose: () => void;
  onConfirm: (deleteLocalData: boolean) => Promise<void> | void;
}

export function ConfirmRemoveDialog({ torrent, onClose, onConfirm }: Props) {
  const [deleteLocalData, setDeleteLocalData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirm(deleteLocalData);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Remove torrent" onClose={onClose}>
      <p>
        Remove <strong>{torrent.name}</strong> from the list?
      </p>
      <label className="field field--checkbox">
        <input
          type="checkbox"
          checked={deleteLocalData}
          onChange={(e) => setDeleteLocalData(e.target.checked)}
        />
        <span>Also delete the downloaded files from disk</span>
      </label>
      {deleteLocalData && (
        <p className="form-warning">This permanently deletes the data on disk and can't be undone.</p>
      )}
      {errorMsg && <p className="form-error">{errorMsg}</p>}
      <div className="modal__footer">
        <button type="button" className="button button--ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className="button button--danger" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Removing\u2026" : deleteLocalData ? "Delete files & remove" : "Remove"}
        </button>
      </div>
    </Modal>
  );
}
