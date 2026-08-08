// Mirrors components.schemas in openapi.yaml

export type TorrentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0=Stopped, 1=QueuedToVerify, 2=Verifying, 3=QueuedToDownload,
// 4=Downloading, 5=QueuedToSeed, 6=Seeding

export interface Torrent {
  id: number;
  hashString: string;
  name: string;
  status: TorrentStatus;
  percentDone: number;
  rateDownload: number; // bytes/sec
  rateUpload: number; // bytes/sec
  eta: number; // seconds, or -1/-2 for unknown/not applicable
  totalSize: number;
  downloadedEver: number;
  uploadedEver: number;
  uploadRatio: number;
  error: number;
  errorString: string;
  downloadDir: string;
  isFinished: boolean;
  peersConnected: number;
  addedDate: number;
}

export interface AddTorrentRequest {
  magnet?: string;
  url?: string;
  metainfo?: string; // base64
  downloadDir?: string;
  paused?: boolean;
}

export interface AddTorrentResponse {
  added?: boolean;
  duplicate?: boolean;
  torrent?: {
    id?: number;
    name?: string;
    hashString?: string;
  };
}

export interface StatsBucket {
  downloadedBytes: number;
  uploadedBytes: number;
  filesAdded: number;
  sessionCount: number;
  secondsActive: number;
}

export interface SessionStats {
  activeTorrentCount: number;
  downloadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
  uploadSpeed: number;
  "cumulative-stats": StatsBucket;
  "current-stats": StatsBucket;
}

export interface SpeedLimitRequest {
  downloadKBps?: number | null;
  uploadKBps?: number | null;
}

export interface PushSftpRequest {
  remoteFolder: string;
}

export interface SessionSettings {
  [key: string]: unknown;
}

export interface ApiErrorBody {
  error?: string;
}