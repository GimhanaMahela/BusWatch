# BusWatch

Passengers report public transport incidents (reckless driving, overcharging, harassment, …) with
photos, videos and a map pin, get a receipt ID, and track what happens to their report. Admins
review, escalate and resolve reports, keep internal notes, and see analytics such as repeat-offender buses.

| App           | What it is                                  |
| ------------- | ------------------------------------------- |
| [`api/`](api) | REST API: TypeScript, Express 5, PostgreSQL |
| [`ui/`](ui)   | Web app: TypeScript, React 19, Vite, MUI    |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the structure, naming conventions and tech stack.

## Quick start (local)

This is a monorepo with one `package.json` and one `.env` at the root. Requires Node.js 24 (`nvm use`)
and PostgreSQL (or just Docker: `docker compose up -d postgres`).

```bash
cp .env.example .env   # set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL
npm install
npm run dev            # migrates the DB, then API on :5000 and UI on http://localhost:3000
```

The UI calls the API at `/api` on its own origin; the Vite dev server forwards those requests to the API.
On first start the API creates a superadmin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Other admins are
added from the dashboard's **Admins** dialog.

## Scripts

| Script                                | Does                                                      |
| ------------------------------------- | --------------------------------------------------------- |
| `dev` (`dev:api`, `dev:ui`)           | Run both apps with reload                                 |
| `build` (`build:api`, `build:ui`)     | Compile the API to `api/dist`, bundle the UI to `ui/dist` |
| `start` / `preview`                   | Run the compiled API / serve the built UI                 |
| `test` (`test:api`, `test:ui`)        | Vitest: API tests and UI component tests                  |
| `lint`, `typecheck`, `format(:check)` | ESLint, TypeScript, Prettier                              |

CI runs `format:check`, `lint`, `typecheck`, `test` and `build` on every push and pull request.

## Docker

```bash
cp .env.example .env   # fill in secrets
docker compose up --build
```

The UI runs on http://localhost:3000 (nginx serves it and forwards `/api` to the API container), the API
on http://localhost:5000 and PostgreSQL on host port 5440 (`POSTGRES_HOST_PORT`). The API container applies database migrations on
start.

## Vercel

One Vercel project deploys both apps from the repo root (`vercel.json`): the UI as static files and
the API as a serverless function under `/api`. Set the variables from `.env.example` in the project settings;
`DATABASE_URL` should point to a hosted Postgres (Neon, Supabase, …). Migrations run during the build.
