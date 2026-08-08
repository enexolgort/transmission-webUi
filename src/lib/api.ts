import type {
  AddTorrentRequest,
  AddTorrentResponse,
  ApiErrorBody,
  PushSftpRequest,
  SessionSettings,
  SessionStats,
  SpeedLimitRequest,
  Torrent,
} from "../types";
import type { Settings } from "./settings";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Thin wrapper around the transmission-api HTTP endpoints described in
 * openapi.yaml. One instance is created per (baseUrl, apiKey) pair -- see
 * useApi() which re-creates it whenever settings change.
 */
export class ApiClient {
  constructor(private settings: Settings) {}

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers as Record<string, string> | undefined),
    };
    if (this.settings.apiKey) {
      headers["X-API-Key"] = this.settings.apiKey;
    }

    let res: Response;
    try {
      res = await fetch(`${this.settings.baseUrl}${path}`, {
        ...init,
        headers,
      });
    } catch (err) {
      throw new ApiError(
        0,
        `Could not reach ${this.settings.baseUrl} -- is the API running and is this address reachable from here? (${(err as Error).message})`,
      );
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const body = isJson ? await res.json().catch(() => undefined) : undefined;

    if (!res.ok) {
      const message =
        (body as ApiErrorBody | undefined)?.error ??
        `Request failed with status ${res.status}`;
      throw new ApiError(res.status, message);
    }

    return body as T;
  }

  health(): Promise<{ status: string }> {
    return this.request("/health");
  }

  listTorrents(): Promise<{ torrents: Torrent[] }> {
    return this.request("/torrents");
  }

  getTorrent(id: number): Promise<{ torrent: Torrent }> {
    return this.request(`/torrents/${id}`);
  }

  addTorrent(payload: AddTorrentRequest): Promise<AddTorrentResponse> {
    return this.request("/torrents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  removeTorrent(id: number, deleteLocalData: boolean): Promise<void> {
    const query = deleteLocalData ? "?deleteLocalData=true" : "";
    return this.request(`/torrents/${id}${query}`, { method: "DELETE" });
  }

  startTorrent(id: number): Promise<void> {
    return this.request(`/torrents/${id}/start`, { method: "POST" });
  }

  stopTorrent(id: number): Promise<void> {
    return this.request(`/torrents/${id}/stop`, { method: "POST" });
  }

  verifyTorrent(id: number): Promise<void> {
    return this.request(`/torrents/${id}/verify`, { method: "POST" });
  }

  setTorrentLocation(id: number, location: string, move: boolean): Promise<void> {
    return this.request(`/torrents/${id}/location`, {
      method: "PATCH",
      body: JSON.stringify({ location, move }),
    });
  }

  setTorrentSpeedLimit(id: number, limits: SpeedLimitRequest): Promise<void> {
    return this.request(`/torrents/${id}/speed-limit`, {
      method: "PATCH",
      body: JSON.stringify(limits),
    });
  }

  pushToSftp(id: number, remoteFolder: string): Promise<void> {
    return this.request(`/torrents/${id}/push-sftp`, {
      method: "POST",
      body: JSON.stringify({ remoteFolder } satisfies PushSftpRequest),
    });
  }

  getSession(): Promise<{ session: SessionSettings }> {
    return this.request("/session");
  }

  setGlobalSpeedLimit(limits: SpeedLimitRequest): Promise<void> {
    return this.request("/session/speed-limit", {
      method: "PATCH",
      body: JSON.stringify(limits),
    });
  }

  getStats(): Promise<{ stats: SessionStats }> {
    return this.request("/stats");
  }
}