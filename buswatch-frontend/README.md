# BusWatch Web App

React 19 + TypeScript app built with Vite, MUI 9, React Router 8 and TanStack Query.
Components follow Atomic Design; see [../ARCHITECTURE.md](../ARCHITECTURE.md).

## Setup

```bash
cp .env.example .env.local   # VITE_BACKEND_URL, optional VITE_MAPS_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

| Script                        | Does                                                |
| ----------------------------- | --------------------------------------------------- |
| `dev` / `preview`             | Dev server / serve the production build             |
| `build`                       | Type-check and bundle to `dist/`                    |
| `test`                        | Component and unit tests (Vitest + Testing Library) |
| `lint`, `typecheck`, `format` | ESLint, `tsc -b`, Prettier                          |

## Deploying

- **Vercel**: `vercel.json` builds with Vite and rewrites all paths to `index.html` for client-side routing.
- **Docker**: the `Dockerfile` builds with `VITE_*` build args and serves `dist/` with nginx.
  `VITE_BACKEND_URL` is baked in at build time and must be reachable from the browser.
