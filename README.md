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

**Two-way contact**

- **My reports** (`/my-reports`): no password. The passenger enters the email or mobile number they
  reported with and gets a one-time code; the list shows every report and flags new team messages.
- **Messages between admin and passenger**: admins ask for details from the report page ("Which seat
  were you in?"); the passenger reads and replies on the tracking page, where the team appears as
  "BusWatch team". Unread replies are flagged in the admin reports table.
- **SMS or WhatsApp updates**: an optional mobile number on the forms. Receipts, status changes and new
  messages are texted from your own Android phone (free, SMS Gateway for Android) or through Notify.lk
  or Twilio (`SMS_PROVIDER`). Texts link to the report and never contain the team's message itself.
  With no SMS set up, the phone field is hidden.
- **Telegram updates**: "Get updates on Telegram" on the tracking and receipt pages opens the BusWatch
  bot; pressing Start follows the report, `/stop` ends all updates. Free, no phone number needed.
- **Browser push notifications**: "Get notified on this device" on the tracking and receipt pages
  (Web Push, `VAPID_*` keys). On iPhone it works once BusWatch is added to the Home Screen.

Status changes and messages go out on every channel the passenger gave (email, SMS, push, Telegram), in their
language; the admin sees which ones reached them.

The admin **Analytics** page tracks the Phase 1 success metrics: form completion rate, return visits to
tracking, average outcome rating, reports from QR codes and time to first response (anonymous daily
counts, no personal data), plus messages, passenger replies, My reports sign-ins and push sign-ups.

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

### Optional services

| Feature                  | Variables                                                    | Without them                                      |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------- |
| Emails (receipts, codes) | `EMAIL_SERVICE_*`                                            | Skipped (codes printed in dev)                    |
| SMS / WhatsApp           | `SMS_PROVIDER` + `ANDROID_SMS_*`, `NOTIFYLK_*` or `TWILIO_*` | Phone field hidden (in dev: shown, texts printed) |
| Telegram                 | `TELEGRAM_BOT_TOKEN` (+ `TELEGRAM_WEBHOOK_SECRET` hosted)    | The Telegram card is hidden                       |
| Browser push             | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`     | The "Get notified" card is hidden                 |
| CAPTCHA                  | `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`     | Submissions aren't checked                        |

**Free options:** browser push, Telegram and SMS from an Android phone cost nothing (the phone only uses
its SIM's SMS package). For SMS, install [SMS Gateway for Android](https://sms-gate.app) on a spare
Android phone, set `SMS_PROVIDER=android` and copy the username and password the app shows (cloud mode
works from anywhere; local mode needs the API and phone on the same network). For Telegram, create a bot
with [@BotFather](https://t.me/BotFather) (`/newbot`) and set `TELEGRAM_BOT_TOKEN`; the API starts
listening for the bot's messages on its own.

Generate push keys once with `npx web-push generate-vapid-keys`. For WhatsApp through Twilio, set
`TWILIO_FROM=whatsapp:+…`; messages a passenger didn't start need templates approved by WhatsApp, so
start with SMS.

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
