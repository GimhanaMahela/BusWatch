# BusWatch UI

Next.js 16 (App Router) + TypeScript web app with MUI 9, MUI X (Data Grid, Charts) and TanStack Query.
Components follow Atomic Design. Setup and scripts are in the [root README](../README.md); structure
and conventions in [ARCHITECTURE.md](../ARCHITECTURE.md).

- Calls the API at same-origin `/api` unless `NEXT_PUBLIC_API_URL` is set. Next forwards `/api` to
  `API_UPSTREAM` (default `http://localhost:$PORT`; the Docker image uses `http://api:5000`).
- Reads the repo-root `.env` (`next.config.ts` loads it). `NEXT_PUBLIC_*` variables and the rewrite
  target are baked in at build time.
- Light and dark mode follow the system setting until the visitor picks one (toggle in the header).
- `npm run build:ui` produces a standalone server in `ui/.next/standalone` (used by `ui/Dockerfile`).
