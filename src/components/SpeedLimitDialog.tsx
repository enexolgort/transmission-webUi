import { useState } from "react";
import { Modal } from "./Modal";
import type { SpeedLimitRequest } from "../types";

type Mode = "unchanged" | "value" | "none";

interface DirectionState {
  mode: Mode;
  value: string;
}

interface Props {
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: (limits: SpeedLimitRequest) => Promise<void> | void;
}

function DirectionControl({
  label,
  state,
  setState,
}: {
  label: string;
  state: DirectionState;
  setState: (s: DirectionState) => void;
}) {
  return (
    <fieldset className="speed-direction">
      <legend>{label}</legend>
      <label className="field--radio">
        <input
          type="radio"
          checked={state.mode === "unchanged"}
          onChange={() => setState({ ...state, mode: "unchanged" })}
        />
        <span>Leave unchanged</span>
      </label>
      <label className="field--radio">
        <input
          type="radio"
          checked={state.mode === "value"}
          onChange={() => setState({ ...state, mode: "value" })}
        />
        <span>Limit to</span>
        <input
          type="number"
          min={0}
          className="speed-direction__input"
          disabled={state.mode !== "value"}
          value={state.value}
          onChange={(e) => setState({ ...state, mode: "value", value: e.target.value })}
        />
        <span className="speed-direction__unit">KB/s</span>
      </label>
      <label className="field--radio">
        <input
          type="radio"
          checked={state.mode === "none"}
          onChange={() => setState({ ...state, mode: "none" })}
        />
        <span>No limit</span>
      </label>
    </fieldset>
  );
}

export function SpeedLimitDialog({ title, description, onClose, onSubmit }: Props) {
  const [download, setDownload] = useState<DirectionState>({ mode: "unchanged", value: "" });
  const [upload, setUpload] = useState<DirectionState>({ mode: "unchanged", value: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toField = (s: DirectionState): number | null | undefined => {
    if (s.mode === "unchanged") return undefined;
    if (s.mode === "none") return null;
    const n = Number(s.value);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const bothUnchanged = download.mode === "unchanged" && upload.mode === "unchanged";
  const invalidValue =
    (download.mode === "value" && download.value.trim() === "") ||
    (upload.mode === "value" && upload.value.trim() === "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bothUnchanged || invalidValue || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: SpeedLimitRequest = {};
      const d = toField(download);
      const u = toField(upload);
      if (d !== undefined) payload.downloadKBps = d;
      if (u !== undefined) payload.uploadKBps = u;
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="speed-limit-form">
        {description && <p className="muted">{description}</p>}
        <DirectionControl label="Download" state={download} setState={setDownload} />
        <DirectionControl label="Upload" state={upload} setState={setUpload} />
        {errorMsg && <p className="form-error">{errorMsg}</p>}
        <div className="modal__footer">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="button button--primary"
            disabled={bothUnchanged || invalidValue || submitting}
          >
            {submitting ? "Saving\u2026" : "Save limits"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
