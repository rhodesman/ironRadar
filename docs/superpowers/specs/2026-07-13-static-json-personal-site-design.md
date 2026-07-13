# IronRadar — Repurpose for Personal Site (Static JSON + Docker)

**Date:** 2026-07-13
**Status:** Approved (design)

## Goal

Repurpose the production IronRadar dashboard to run as a self-contained showcase on
a personal website. The original threat-intelligence API and the Microsoft (MSAL)
login are both dead. The app must instead load a bundled static snapshot
(`root_30d.json`) and run with no external dependencies, packaged as a single Docker
container to run on a personal Ubuntu server behind a reverse proxy.

## Context / Current Architecture

- **Project root:** `production/ironradar/` (git repo, branch `development`).
- **Frontend:** `dashboard/` — AdminKit/Bootstrap 5 SPA built with webpack. Entry is
  `src/js/app.js` → compiles to `static/js/app.js`. `static/index.html` is the real
  dashboard page and renders the threat table, charts, and world map.
- **Backend:** `backend-server/server.js` — Express server (port 8888).
- **Data snapshot:** `dashboard/static/data/root_30d.json` (8.9 MB) — already present,
  shape is `{ ip: { port: [ {indicator, port, last_seen, threat, threat_type,
  confidence, tlp, type}, ... ] } }`, exactly what `processData` expects.

### How data flows today (and why it's broken)

1. `index.html` loads `app.js`, whose `startApp()` runs an **MSAL** auth check and
   redirects to `login.html`/`dashboard.html` before the dashboard is shown. The
   Azure app and its `radar.festratus.com` redirect URIs are dead → nobody gets in.
2. If it did render, `ironRadar.js` calls `$.getJSON(apiURL)` where
   `apiURL = https://radar.festratus.com/api/data` (dead remote host).
3. The backend `/api/data` proxies to an external threat API via `axios` (dead).
4. The frontend POSTs the dataset to `/api/getGeoData`; the backend geolocates IPs
   with `geoip-lite` (uses its own bundled DB — **works offline**) and returns
   per-country counts for the map.

`login.html` / `dashboard.html` load stale pre-built bundles (older than source) and
exist only to support the auth flow.

## Decisions

- **Login:** removed entirely — the site is a public portfolio showcase.
- **Deployment:** a single Docker container running one Express process that serves
  both the built frontend and the `/api/*` routes on one port.

## Design

### Serving model

One Express process serves the production-built frontend (`dashboard/static`) as
static files **and** handles `/api/*`, on a single port. All frontend→backend calls
become same-origin. No dev server in production; no external network calls.

### Changes

1. **`dashboard/src/js/modules/ironRadar/config.js`**
   - `apiURL = '/api/data'`, `getGeoData = '/api/getGeoData'` (same-origin; drop the
     dead `radar.festratus.com` / EC2 hosts).

2. **`dashboard/src/js/app.js`**
   - Remove the MSAL redirect gate in `startApp()` and the `MSAuth` import so
     `index.html` renders the dashboard directly.

3. **`backend-server/server.js`**
   - `/api/data`: replace the dead `axios` API call with a read of the local
     `root_30d.json` from disk (read from the served data folder); return its parsed
     contents. Keep JSON error handling.
   - Serve the built frontend: `express.static(<dashboard/static>)` with `index.html`
     as default.
   - Delete the MSAL config and the `/auth/callback` route.
   - Keep `/api/getGeoData`, `/convert-json`, and GeoIP logic unchanged.

4. **Rebuild:** `NODE_ENV=production npm run build` in `dashboard/` so
   `static/js/app.js` reflects the edits.

5. **Dockerfile** (new, at `production/ironradar/`)
   - Node base image (match the version the backend needs; Node 18/20 LTS).
   - Copy `backend-server/` and the built `dashboard/static/`.
   - `npm ci` (or `npm install`) for the backend only.
   - `EXPOSE` one port (default 8888 via `PORT`); `CMD ["node", "server.js"]`.
   - The user points their reverse proxy / public URL at that port.

### Data flow after changes

Browser loads `index.html` (Express) → `GET /api/data` returns local `root_30d.json`
→ frontend renders table + charts → `POST /api/getGeoData` returns geolocated
country counts for the map. Fully self-contained.

### Orphaned files

`login.html`, `dashboard.html`, `login.js`, `dashboard.js`, and the `MSAuth` /
`authFunctions` modules become unused. Leave them in place (harmless) or delete for
tidiness — deletion is optional and not required for the app to work.

## Testing

Manual verification before building the image:

1. Build the frontend (`NODE_ENV=production npm run build`).
2. Run `node server.js` from `backend-server/`.
3. Open the port in a browser and confirm:
   - The dashboard renders directly (no login redirect).
   - The threat table populates from `root_30d.json`.
   - Pie/port charts render.
   - The world map shows country markers (confirms `/api/getGeoData`).
4. Then build the Docker image and repeat the browser check against the container.

## Out of Scope

- Refreshing or regenerating the threat snapshot (data is a fixed historical export).
- Any new features, styling changes, or reverse-proxy/TLS configuration on the
  Ubuntu host (user handles the proxy + DNS).
