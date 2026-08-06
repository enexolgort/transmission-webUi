# Transmission UI

A web UI for a `transmission-api` backend (the Express/TypeScript wrapper around
Transmission's RPC), built against the provided `openapi.yaml`. React + Vite +
TypeScript, runs as its own small server/process alongside your existing API.

## Features

- Torrent list polling `GET /torrents` every 3s: progress bar, status,
  down/up speed, ETA, size, peers, ratio.
- Add torrents by magnet link, `.torrent` URL, or `.torrent` file upload
  (files are base64-encoded client-side and sent as `metainfo`).
- Per-torrent actions: start, stop, verify, remove (with optional
  "also delete local data"), and per-torrent speed limits.
- Session view: global stats (`GET /stats`, polled every 5s) and the global
  speed limit (`PATCH /session/speed-limit`).
- Connection settings (API base URL + optional API key) are configurable in
  the UI itself, stored per-browser in `localStorage` -- nothing is
  hardcoded, and no rebuild is needed to point at a different host.

## Requirements

- Docker (recommended), **or** Node.js 18+ to run it directly
- Your `transmission-api` backend already running somewhere reachable.

## Run with Docker (recommended)

The included `Dockerfile` builds the app and serves the static output with
nginx -- no Node.js needed on the host, just Docker.

```bash
docker compose up -d --build
```

That builds the image and starts a container publishing port `4173` (mapped
to nginx's port 80 inside the container) on **all of the host's network
interfaces** -- Docker publishes ports to `0.0.0.0` by default, so this is
reachable at `http://<host-tailscale-ip-or-name>:4173` from any device on
your tailnet, the same as running it directly. No `--host` flags or
`.wslconfig` networking tweaks needed for this path, since Docker Desktop
(and Docker on native Linux) already handles exposing published ports to
the host network.

Without compose:

```bash
docker build -t transmission-ui .
docker run -d --name transmission-ui -p 4173:80 --restart unless-stopped transmission-ui
```

To change the published port, edit the left-hand side of the port mapping,
e.g. `-p 8080:80` or `"8080:80"` in `docker-compose.yml`.

Logs / status / stop:

```bash
docker compose logs -f
docker compose ps
docker compose down
```

Because the API base URL and API key are set at runtime in the browser
(Settings tab, stored in `localStorage`), you don't need to rebuild or pass
any environment variables into the container to point it at a different
API host -- the same image works for everyone, configured per-browser
after it's running.

## Run directly with Node (alternative)

```bash
npm install
npm run dev        # dev server, http://<this-machine>:5173, hot reload
# or
npm run build       # production build to dist/
npm run start        # serve the production build, http://<this-machine>:4173
```

Both `dev` and `start`/`preview` bind to `0.0.0.0` (see `vite.config.ts`), so
they're reachable from any device on your Tailscale network, not just
`localhost` -- Tailscale just routes to whatever this machine is already
listening on. Once running, open `http://<this-machine's-tailscale-name-or-IP>:4173`
(or `:5173` for dev) from any device on your tailnet.

On first load, go to **Session & settings** and set:

- **API base URL** -- where your `transmission-api` backend is reachable
  from the browser you're using. If the UI and API run on the same box you
  can use `http://localhost:3000` from that box, but from another device on
  your tailnet use the API host's Tailscale address instead, e.g.
  `http://my-server:3000` or `http://100.x.y.z:3000`.
- **API key** -- only if you've set `API_KEY` on the backend.

Use **Test connection** to confirm before saving.

## Important: CORS on the backend

Because this UI runs as its own process on its own origin (a different
port than the API, and potentially a different device entirely), the
browser will make cross-origin requests from the UI to the API. Your
Express backend needs to send CORS headers or the browser will block the
requests. If it doesn't already, add something like:

```ts
import cors from "cors";

app.use(
  cors({
    origin: true, // reflects the request's Origin -- fine for a private tailnet
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-Key"],
  }),
);
```

(`npm install cors` and `@types/cors` if you don't have it already.)

## Reaching the API from another device

If you plan to open this UI from a phone or another machine on your
tailnet (not just the box the API runs on), make sure the API server
itself is also listening on `0.0.0.0` (or at least the Tailscale
interface) rather than only `127.0.0.1`/`localhost` -- otherwise it'll be
reachable to the UI when both are on the same machine but not from
anywhere else on the tailnet.

## Running it long-term (without Docker)

If you're running directly with Node rather than Docker (which already
restarts on its own via `restart: unless-stopped`), use a process manager
rather than a bare `npm run start` in a terminal, e.g.:

```bash
npm install -g pm2
pm2 start "npm run start" --name transmission-ui
pm2 save
```

or a systemd unit that runs `npm run start` in this directory.

## Project structure

```
Dockerfile                   Multi-stage build: node (build) -> nginx (serve)
nginx.conf                   nginx config for the built static app
docker-compose.yml           Convenience wrapper around `docker build`/`run`
.dockerignore
src/
  types.ts                  Types mirroring openapi.yaml schemas
  lib/
    api.ts                  Typed fetch client for every endpoint
    settings.ts              localStorage read/write for base URL + API key
    SettingsContext.tsx      React context exposing settings + the API client
    ToastContext.tsx         Lightweight notification system
    format.ts                 Byte/speed/ETA formatting, status label/color map
  hooks/
    useTorrents.ts            Polls GET /torrents
    useStats.ts                Polls GET /stats
    useInterval.ts             Polling helper, pauses on hidden tabs
  components/                UI: table, rows, dialogs, settings panel, etc.
```

## Notes on API behavior assumed from openapi.yaml

- `POST /torrents` takes exactly one of `magnet` / `url` / `metainfo`; the
  UI enforces picking one source at a time.
- Speed limit endpoints (`PATCH /session/speed-limit`,
  `PATCH /torrents/:id/speed-limit`) treat an **omitted** field as "leave
  unchanged" and an explicit `null` as "remove the limit" -- the speed
  limit dialog has a three-way choice per direction (leave unchanged / set
  a value / no limit) to match that exactly.
- The `Torrent` schema doesn't expose a torrent's *current* per-torrent
  speed limit, so the per-torrent speed limit dialog can't pre-fill
  existing values -- it always starts from "leave unchanged" for both
  directions.
