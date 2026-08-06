import type { TorrentStatus } from "../types";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "--";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "--";
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(seconds: number): string {
  if (seconds === -1) return "\u221e"; // unknown
  if (seconds === -2 || seconds < -2) return "--"; // not applicable
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function formatDate(unixSeconds: number): string {
  if (!unixSeconds) return "--";
  return new Date(unixSeconds * 1000).toLocaleString();
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "--";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  return parts.join(" ");
}

export interface StatusMeta {
  label: string;
  colorVar: string;
  icon: string; // simple glyph, kept dependency-free
  animated: boolean;
}

const STATUS_META: Record<TorrentStatus, StatusMeta> = {
  0: { label: "Stopped", colorVar: "--status-stopped", icon: "\u23F8", animated: false },
  1: { label: "Queued to verify", colorVar: "--status-queued", icon: "\u2026", animated: false },
  2: { label: "Verifying", colorVar: "--status-verifying", icon: "\u21BB", animated: true },
  3: { label: "Queued to download", colorVar: "--status-queued", icon: "\u2026", animated: false },
  4: { label: "Downloading", colorVar: "--status-downloading", icon: "\u2193", animated: true },
  5: { label: "Queued to seed", colorVar: "--status-queued", icon: "\u2026", animated: false },
  6: { label: "Seeding", colorVar: "--status-seeding", icon: "\u2191", animated: false },
};

export function getStatusMeta(status: TorrentStatus): StatusMeta {
  return STATUS_META[status] ?? { label: `Unknown (${status})`, colorVar: "--status-stopped", icon: "?", animated: false };
}
