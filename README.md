# BusWatch

Passengers report public transport incidents (reckless driving, overcharging, harassment, …) with
photos, videos and a map pin, get a receipt ID, and track what happens to their report. Admins
review, escalate and resolve reports, keep internal notes, and see analytics such as repeat-offender buses.

**Passenger features**

- **English, සිංහල and தமிழ்**: switch in the header (remembered in a cookie). Receipts, PDF and status
  emails follow the language the report was written in.
- **QR sticker per bus**: admins print stickers from **QR stickers**; scanning `/r/<bus>` opens the form
  with the bus number filled in, and the report is counted as "from a QR code".
- **Works with a weak signal**: installable app (manifest + service worker). Unfinished forms, photos
  included, are kept on the phone; reports sent while offline wait in an outbox and go out automatically.
- **Commend a driver** (`/commend-a-driver`): a one-step form for praise, kept out of complaint statistics.
- **Rate the outcome**: once a complaint is closed, the passenger rates it 1–5 on the tracking page
  (linked from the resolution email).
- **Share a tracking link**: phone share sheet or copy, with a preview image showing the current status.

**Public results**

- **Impact page** (`/impact`): reports received and resolved, resolution rate, typical time to resolve,
  monthly trend, categories, passenger satisfaction and commendations. Refreshed every few minutes.
- **Incident heatmap**: where checked reports cluster, as ~5 km areas on an outline of Sri Lanka. Areas
  with fewer than 3 reports are not shown; no individual points or times.
- **Bus and route scorecards** (`/bus/NB-1234`, `/route/08`): published only once a bus or route has at
  least 3 reports checked by an admin.
- **Resolved case stories**: anonymised write-ups admins draft and publish from **Stories** (optionally
  in Sinhala and Tamil).
- **Fairness and abuse protection**: only reports an admin moved past _pending_ count publicly (rejected
  ones never do), admins can exclude a disputed report, and submissions pass Cloudflare Turnstile when
  `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are set.

The admin **Analytics** page tracks the Phase 1 success metrics: form completion rate, return visits to
tracking, average outcome rating, reports from QR codes and time to first response (anonymous daily
counts, no personal data).

| App           | What it is                                  |
| ------------- | ------------------------------------------- |
| [`api/`](api) | REST API: TypeScript, Express 5, PostgreSQL |
| [`ui/`](ui)   | Web app: TypeScript, Next.js 16, MUI 9      |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the structure, naming conventions and tech stack.

## Quick start (local)

This is a monorepo with one `package.json` and one `.env` at the root. Requires Node.js 24 (`nvm use`)
and PostgreSQL (or just Docker: `docker compose up -d postgres`).

```bash
cp .env.example .env   # set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL
npm install
npm run dev            # migrates the DB, then API on :5000 and UI on http://localhost:3000
```

The UI calls the API at `/api` on its own origin; the Next.js server forwards those requests to the API.
On first start the API creates a superadmin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Other admins are
added from the dashboard's **Admins** dialog.

## Scripts

| Script                                | Does                                                      |
| ------------------------------------- | --------------------------------------------------------- |
| `dev` (`dev:api`, `dev:ui`)           | Run both apps with reload                                 |
| `build` (`build:api`, `build:ui`)     | Compile the API to `api/dist`, build the UI to `ui/.next` |
| `start` / `start:ui`                  | Run the compiled API / serve the built UI                 |
| `test` (`test:api`, `test:ui`)        | Vitest: API tests and UI component tests                  |
| `lint`, `typecheck`, `format(:check)` | ESLint, TypeScript, Prettier                              |

CI runs `format:check`, `lint`, `typecheck`, `test` and `build` on every push and pull request.

## Docker

```bash
cp .env.example .env   # fill in secrets
docker compose up --build
```

The UI runs on http://localhost:3000 (a Next.js server that forwards `/api` to the API container), the API
on http://localhost:5000 and PostgreSQL on host port 5440 (`POSTGRES_HOST_PORT`). The API container applies database migrations on
start.

## Vercel

One Vercel project deploys both apps from the repo root (`vercel.json`): the UI as a Next.js app and
the API as a serverless function under `/api`. Set the variables from `.env.example` in the project settings;
`DATABASE_URL` should point to a hosted Postgres (Neon, Supabase, …). Migrations run during the build.
