# BusWatch UI

React 19 + TypeScript web app built with Vite, MUI 9, React Router 8 and TanStack Query. Components
follow Atomic Design. Setup and scripts are in the [root README](../README.md); structure and
conventions in [ARCHITECTURE.md](../ARCHITECTURE.md).

- Calls the API at same-origin `/api` unless `VITE_BACKEND_URL` is set (Vite dev proxy, nginx in
  Docker and Vercel routes all forward `/api`).
- Reads `VITE_*` variables from the repo-root `.env`; they are baked in at build time.
