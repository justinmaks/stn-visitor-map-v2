# Visitor Map (Next.js + SQLite)

A modern Next.js app that displays a global map with dots for each visitor location, plus a Stats page with charts. Data is stored in SQLite. Designed to run locally and behind Nginx/Cloudflare with proxy-aware IP detection. Docker and docker-compose included.

## Features
- Global map of visitor locations (Leaflet + OpenStreetMap)
- Visitor tracking API with proxy-aware IP extraction (Cloudflare/Nginx headers) and geolocation fallback
- Stats dashboard with daily visits, top countries, and top paths (Chart.js)
- SQLite via better-sqlite3 with automatic schema creation
- Dockerfile targeting Node 24 and docker-compose with bind-mounted DB volume

## Quick Start (Local)
1. Install dependencies:
   ```bash
   npm ci
   ```
2. Copy environment:
   ```bash
   cp .env.example .env
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000`.

## Docker
Build and run using docker-compose (Node 24 base image):
```bash
docker compose up --build
```
- App: `http://localhost:3000`
- SQLite DB path (host): `./data/visitors.db`

## Deployment Behind Nginx/Cloudflare
- Cloudflare is auto-detected via `cf-*` headers; no `TRUST_PROXY` needed.
- If you are using only Nginx without Cloudflare, set `TRUST_PROXY=true` and ensure Nginx strips client-supplied forwarding headers and sets its own.
- Set a strong `IP_SALT` for hashing IPs.

Example Nginx Proxy Manager advanced config:
```nginx
proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
proxy_set_header X-Real-IP $http_cf_connecting_ip;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

## Data Model
Table `visits` captures hashed IP, derived geo (lat/lon/city/region/country), user agent details, referer, path, and timestamp.

## Tech Stack
- Next.js App Router
- Leaflet (direct)
- Chart.js via react-chartjs-2
- SQLite (better-sqlite3)
- SWR

## Notes
- Geolocation uses `ipapi.co` as a fallback. You can replace with your preferred provider.
- For local development (127.0.0.1), geo lookup is skipped.

## Scripts
- `npm run dev`: Start dev server
- `npm run build`: Build
- `npm start`: Start production server
- `npm run lint`: Lint

## License
MIT
