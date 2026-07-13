# IronRadar Static-JSON Personal-Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repurpose the IronRadar dashboard to load a bundled static snapshot (`root_30d.json`) with no login and no external API, served by a single Express process and packaged as one Docker container.

**Architecture:** Remove the dead MSAL login gate and the dead remote API. The frontend fetches same-origin `/api/*`; Express serves both the production-built frontend and the `/api/*` routes on one port. `/api/data` reads the local JSON file; `/api/getGeoData` keeps its offline GeoIP logic for the map.

**Tech Stack:** Node.js/Express (backend), webpack + AdminKit/Bootstrap 5/jQuery (frontend), `geoip-lite`, Docker.

## Global Constraints

- Project root for all paths: `production/ironradar/` (git repo, branch `development`).
- No external network calls at runtime — all data comes from the bundled `root_30d.json`.
- Single Express process, single port (default `8888` via `PORT` env var).
- Docker base image: `node:20-slim` (stable LTS; the frontend is pre-built on the host, so the container only runs the backend).
- Do not modify `root_30d.json` — it is a fixed historical export at `dashboard/static/data/root_30d.json`.
- This is not a TDD codebase (no test runner). Each task ends with a concrete verification command instead of a unit test.

---

### Task 1: Point the frontend at same-origin API URLs

**Files:**
- Modify: `dashboard/src/js/modules/ironRadar/config.js`

**Interfaces:**
- Produces: `export const apiURL = '/api/data'` and `export const getGeoData = '/api/getGeoData'` — consumed by `ironRadar.js` (`$.getJSON(apiURL)`) and `queryData.js` (`fetch(getGeoData)`).

- [ ] **Step 1: Replace the whole file contents**

Replace the entire contents of `dashboard/src/js/modules/ironRadar/config.js` with:

```javascript
/** Same-origin API endpoints — served by the local Express backend. **/
export const getGeoData = '/api/getGeoData';
export const apiURL = '/api/data';
```

- [ ] **Step 2: Verify no dead host remains**

Run: `grep -rn "festratus\|amazonaws\|http" dashboard/src/js/modules/ironRadar/config.js`
Expected: no output (exit code 1).

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/js/modules/ironRadar/config.js
git commit -m "feat: point frontend at same-origin /api endpoints"
```

---

### Task 2: Remove the MSAL login gate from the frontend entry

**Files:**
- Modify: `dashboard/src/js/app.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `app.js` no longer imports `MSAuth` and no longer redirects; the dashboard renders directly via the existing `import "./modules/ironRadar"`.

- [ ] **Step 1: Remove the MSAL import and redirect block**

In `dashboard/src/js/app.js`, delete these lines (the MSAL import, the `startApp` definition, and its call):

```javascript
//MSAL Auth
import { msalInstance, initializeMsal } from './modules/ironRadar/MSAuth';

const startApp = async () => {
  await initializeMsal();

  const accounts = msalInstance.getAllAccounts();

  if (accounts.length > 0) {
    // User is authenticated
    window.location.href = '../../dashboard.html';
  } else {
    // User is not authenticated
    window.location.href = '../../login.html';
  }
};

// Start the application
startApp();
```

The file must keep its remaining imports. After the edit the bottom of `app.js` reads:

```javascript
// Maps
import "./modules/vector-maps";

// GeoIP Lite2 API
//import "./modules/geolite2";

//IronRadar
import "./modules/jquery-3.7.1";
import "./modules/ironRadar";
```

- [ ] **Step 2: Verify MSAL is gone from the entry**

Run: `grep -n "MSAuth\|msalInstance\|startApp\|login.html" dashboard/src/js/app.js`
Expected: no output (exit code 1).

- [ ] **Step 3: Commit**

```bash
git add dashboard/src/js/app.js
git commit -m "feat: remove MSAL login gate so dashboard renders directly"
```

---

### Task 3: Rewire the backend to serve local JSON + the built frontend

**Files:**
- Modify: `backend-server/server.js`

**Interfaces:**
- Consumes: local file `dashboard/static/data/root_30d.json` (relative to `server.js`: `../dashboard/static/data/root_30d.json`).
- Produces: `GET /api/data` → the parsed snapshot JSON; Express serves `../dashboard/static` as the site root; `POST /api/getGeoData`, `POST /convert-json` unchanged.

- [ ] **Step 1: Remove the MSAL require**

In `backend-server/server.js`, delete this line (near the top):

```javascript
const msal = require('@azure/msal-node');
```

- [ ] **Step 2: Serve the built frontend instead of `dist`**

Replace this line:

```javascript
app.use(express.static('dist'));
```

with:

```javascript
app.use(express.static(path.join(__dirname, '..', 'dashboard', 'static')));
```

- [ ] **Step 3: Make `/api/data` read the local snapshot**

Replace the entire `/api/data` handler (the `app.get('/api/data', async (req, res) => { ... });` block, including the commented-out `fs.writeFile` section) with:

```javascript
// Serve the bundled static threat snapshot (no external API)
app.get('/api/data', (req, res) => {
    const filePath = path.join(__dirname, '..', 'dashboard', 'static', 'data', 'root_30d.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read local data file:', err);
            return res.status(500).json({ message: 'Failed to read local data file' });
        }
        res.type('application/json').send(data);
    });
});
```

- [ ] **Step 4: Remove the dead MSAL config + auth callback**

Delete this entire block (MSAL config through the `/auth/callback` route):

```javascript
// MSAL configuration
const msalConfig = {
    auth: {
        clientId: '26345f26-ab9b-49a8-8ae1-724821348258',
        authority: 'https://login.microsoftonline.com/599a411f-b08b-45fe-8545-623369f42d16',
        //redirectUri: 'https://radar.festratus.com/auth/callback',
        //redirectUri: 'http://52.190.15.20:8080/dashboard.html',
        redirectUri: window.location.origin + '/dashboard.html',
    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

// Authentication callback route
app.get('/auth/callback', async (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ['user.read'],
        redirectUri: 'https://radar.festratus.com/auth/callback'
    };

    try {
        const response = await cca.acquireTokenByCode(tokenRequest);
        res.redirect('/dashboard.html');  // Redirect to dashboard if login is successful
    } catch (error) {
        console.error('Error during token acquisition:', error);
        res.redirect('/login.html');  // Redirect to login page on error
    }
});
```

The `app.listen(...)` block and the trailing `axios.defaults...` line stay.

- [ ] **Step 5: Verify the backend has no MSAL references and starts cleanly**

Run: `grep -n "msal\|Msal\|MSAL\|auth/callback" backend-server/server.js`
Expected: no output (exit code 1).

Run: `node -c backend-server/server.js && echo SYNTAX_OK`
Expected: `SYNTAX_OK` (no syntax errors).

- [ ] **Step 6: Commit**

```bash
git add backend-server/server.js
git commit -m "feat: serve local JSON snapshot and built frontend, drop MSAL"
```

---

### Task 4: Build the frontend and verify end-to-end locally

**Files:**
- Modify (build output): `dashboard/static/js/app.js` (regenerated by webpack)

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: a working local site at `http://localhost:8888`.

- [ ] **Step 1: Production-build the frontend**

Run:
```bash
cd dashboard && NODE_ENV=production npm run build && cd ..
```
Expected: webpack completes; `dashboard/static/js/app.js` is updated (production build also copies `dist/` into `static/`).

- [ ] **Step 2: Start the backend**

Run (in a background/second shell):
```bash
cd backend-server && node server.js
```
Expected: `Server is running on http://localhost:8888`.

- [ ] **Step 3: Verify `/api/data` returns the snapshot**

Run:
```bash
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://localhost:8888/api/data
```
Expected: `200` and a byte count around `8952084` (~8.9 MB).

- [ ] **Step 4: Verify the dashboard page loads (no login redirect)**

Run:
```bash
curl -s http://localhost:8888/ | grep -c "onPageLoad\|radar\|threat"
```
Expected: a non-zero count (the dashboard markup, not a login page).

- [ ] **Step 5: Verify GeoData endpoint responds**

Run:
```bash
curl -s -X POST http://localhost:8888/api/getGeoData \
  -H 'Content-Type: application/json' \
  -d '{"data":{"8.8.8.8":{"80":[{"threat":"x"}]}}}' | head -c 200
```
Expected: a JSON object containing `"received"`.

- [ ] **Step 6: Manual browser check**

Open `http://localhost:8888/` in a browser and confirm: the threat table populates, the pie/port charts render, and the world map shows country markers. Stop the backend afterward (Ctrl-C).

- [ ] **Step 7: Commit the rebuilt bundle**

```bash
git add dashboard/static
git commit -m "build: production frontend bundle for static-JSON site"
```

---

### Task 5: Containerize as a single image

**Files:**
- Create: `Dockerfile` (at `production/ironradar/Dockerfile`)
- Create: `.dockerignore` (at `production/ironradar/.dockerignore`)

**Interfaces:**
- Consumes: the built `dashboard/static` (Task 4) and `backend-server/` source.
- Produces: a runnable image `ironradar` exposing port `8888`.

- [ ] **Step 1: Create `.dockerignore`**

Create `production/ironradar/.dockerignore` with:

```
**/node_modules
**/*.map
dashboard/src
dashboard/dist
.git
docs
logs
*.log
```

- [ ] **Step 2: Create the `Dockerfile`**

Create `production/ironradar/Dockerfile` with:

```dockerfile
FROM node:20-slim

WORKDIR /app/backend-server

# Install backend deps in-container for correct platform binaries
COPY backend-server/package*.json ./
RUN npm install --omit=dev

# Backend source
COPY backend-server/ ./

# Pre-built frontend (built on host in Task 4)
COPY dashboard/static /app/dashboard/static

ENV PORT=8888
EXPOSE 8888

CMD ["node", "server.js"]
```

- [ ] **Step 3: Build the image**

Run:
```bash
docker build -t ironradar .
```
Expected: build completes with `naming to docker.io/library/ironradar` (or similar success line).

- [ ] **Step 4: Run the container**

Run:
```bash
docker run --rm -p 8888:8888 --name ironradar ironradar
```
Expected: `Server is running on http://localhost:8888`.

- [ ] **Step 5: Verify the container serves data**

In another shell, run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8888/api/data
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8888/
```
Expected: `200` for both. Then open `http://localhost:8888/` in a browser and confirm the dashboard renders as in Task 4. Stop with Ctrl-C.

- [ ] **Step 6: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: single-container Dockerfile for IronRadar personal site"
```

---

## Deployment note (post-implementation, user-run)

On the Ubuntu server: copy the repo (or `docker save`/`load` the image), run
`docker build -t ironradar .` then `docker run -d --restart unless-stopped -p 8888:8888 --name ironradar ironradar`, and point your reverse proxy (nginx/Caddy) + DNS at port `8888`. TLS and proxy config are out of scope for this plan.
