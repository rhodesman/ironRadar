# IronRadar

A threat-intelligence dashboard that visualizes internet-facing malicious
infrastructure — attacker frameworks, ports, confidence levels, and a
geolocated world map of observed indicators.

This is a **self-contained showcase build**. It renders a bundled 30-day threat
snapshot (`dashboard/static/data/root_30d.json`) with no external API and no
login, so it runs anywhere with nothing to configure.

> Originally built for IronNet Cybersecurity. After the company dissolved, the
> live threat API and Microsoft SSO were retired; this version was reworked to
> run entirely off a static snapshot for portfolio/demo purposes.

## How it works

A single Express server (`backend-server/server.js`) does two jobs on one port:

- serves the pre-built frontend from `dashboard/static/`
- exposes the data API:
  - `GET /api/data` — returns the bundled `root_30d.json` snapshot
  - `POST /api/getGeoData` — geolocates indicator IPs with `geoip-lite`
    (bundled offline database) for the world map
  - `POST /convert-json` — exports the current view as CSV

The frontend is an AdminKit / Bootstrap 5 + jQuery app (Chart.js charts,
jsvectormap world map) built with webpack. The compiled bundle is committed
under `dashboard/static/`, so **serving the app requires no frontend build**.

## Run with Docker (recommended)

```bash
docker build -t ironradar .
docker run -d --restart unless-stopped -p 8888:8888 --name ironradar ironradar
```

Then open http://localhost:8888/.

The container listens on port **8888** internally — that never changes. If host
port 8888 is taken, map any free host port to it by changing only the **left**
number, e.g. `-p 8899:8888`, and browse that port instead. To rebuild after
changes:

```bash
git pull && docker build -t ironradar . && docker rm -f ironradar \
  && docker run -d --restart unless-stopped -p 8888:8888 --name ironradar ironradar
```

## Run locally without Docker

Requires Node.js. Build the frontend once, then start the server:

```bash
cd dashboard && npm install && NODE_ENV=production npm run build && cd ..
cd backend-server && npm install && node server.js
```

Open http://localhost:8888/.

## Deploying behind a domain

Put a reverse proxy in front to serve it over HTTPS on a real hostname. With
Caddy (automatic TLS):

```
radar.example.com {
    reverse_proxy localhost:8888
}
```

Point `reverse_proxy` at whichever host port you mapped the container to.

## Project layout

| Path | Purpose |
|------|---------|
| `backend-server/` | Express server: static hosting + data/geo/export API |
| `dashboard/` | Frontend source (`src/`) and built assets (`static/`) |
| `dashboard/static/data/root_30d.json` | Bundled threat snapshot the app renders |
| `Dockerfile` | Single-container build (Node 20, backend + built frontend) |
| `docs/superpowers/` | Design spec and implementation plan |
