# TransitX

![TransitX: Report, Resolve, Improve](docs/brand/transitx-logo.png)

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
- **Commend good service** (`/commend`; the old `/commend-a-driver` redirects): a one-step form to thank
  the driver, the conductor, both, or the bus service as a whole, kept out of complaint statistics.
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
  "TransitX team". Unread replies are flagged in the admin reports table.
- **SMS or WhatsApp updates**: an optional mobile number on the forms. Receipts, status changes and new
  messages are texted from your own Android phone (free, SMS Gateway for Android) or through Notify.lk
  or Twilio (`SMS_PROVIDER`). Texts link to the report and never contain the team's message itself.
  With no SMS set up, the phone field is hidden.
- **Telegram updates**: "Get updates on Telegram" on the tracking and receipt pages opens the TransitX
  bot; pressing Start follows the report, `/stop` ends all updates. Free, no phone number needed.
- **Browser push notifications**: "Get notified on this device" on the tracking and receipt pages
  (Web Push, `VAPID_*` keys). On iPhone it works once TransitX is added to the Home Screen.

**Wider ecosystem**

- **"Me too" confirmations**: after "What happened", the report form looks for complaints about the
  same bus, category and day. If there are any, it asks "Did you see this too?" and the passenger can
  back up the existing report (with an optional comment for the team) instead of filing a duplicate.
  Anonymous, one per device; the original passenger sees the count on their tracking page and admins
  see each confirmation on the report.

- **Operator portal** (`/operator`): a superadmin adds a bus owner or company as an _operator_ account
  with their bus numbers. Operators sign in on the admin login page and land in their own portal: an
  overview of their fleet and the reports about their buses that admins have checked (never pending,
  rejected or hidden ones, and never the passenger's contact details, receipt ID, notes or messages).
  They can publish a response ("We retrained the driver"), which the passenger sees on the tracking
  page with the operator's name; admins can hide a response.

- **AI help for admins** (optional, `GEMINI_API_KEY`): an AI assistant panel on each report suggests
  a category (one click to apply), translates Sinhala and Tamil into English, summarises long reports
  and flags emergencies, personal details or abuse. "Blur faces and plates" makes Cloudinary copies of
  the photos with faces and number plates blurred; operators only ever see those. Uses Google
  Gemini's free tier (`AI_MODEL`, default `gemini-flash-latest`; free key at aistudio.google.com); `AI_AUTO_ANALYSE=true` analyses each new report on arrival.

- **TransitX helper chat** (same `GEMINI_API_KEY`; `AI_CHAT_ENABLED=false` hides it): a chat bubble on
  every public page answers questions about TransitX in English, Sinhala or Tamil and helps passengers
  put a complaint or commendation into words. It never sends anything itself: "Open the form" fills in
  the normal form, where the passenger checks it, adds photos and contact details, and sends it.

- **WhatsApp bot** (optional, Meta's WhatsApp Cloud API): passengers chat with TransitX on WhatsApp
  in English, Sinhala or Tamil. The helper asks for the bus, route, place and what happened (typed or
  as a **voice note**), takes photos, videos and a shared location, shows the finished report and files
  it when the passenger presses **Send report**. They get the receipt ID and PDF in the chat, and status
  updates there. Sending a receipt ID shows a report's status with a **Get updates here** button;
  **STOP** ends all updates and forgets the conversation. "Chat on WhatsApp" buttons appear on the home
  page, footer, helper chat, receipt and tracking pages once the bot is set up.

**Passenger safety and everyday help**

- **Lost and found** (`/lost-something`): "I left my bag on bus NB-1234." A third report type with its
  own receipt, tracking page and updates. A way to reach the passenger is required. Unlike complaints,
  operators see a lost item as soon as it arrives (never the passenger's contact details). They can
  post updates or press **We found it** with where to collect it, which closes the report. The
  passenger is told on every channel straight away. Lost items never count in complaint figures.
- **Fare checker** (`/fare-check`): the passenger picks a route, two stops and the bus type and sees
  the official fare. Fares go by NTC fare stages: admins paste each service class's fare-stage table
  and each route's stops with their stages on the admin **Fares** page. When the passenger paid more,
  **Report it** opens an overcharging complaint with the fare check attached. On the report form, an
  overcharging complaint can attach it too. The server always works out the official fare itself,
  so the evidence can't be made up in the browser.
- **Accessibility reports**: an "Accessibility" category with a checklist (priority seat not given up,
  didn't stop for an elderly or disabled passenger, step too high, no room for a wheelchair…). Bus and
  route scorecards get an accessibility section once there are at least 3 checked accessibility
  complaints.
- **Safety mode** (`/safety`): a quick, quiet harassment report (bus, route and a few ticks; nothing
  else required), the emergency numbers and the women's helpline always in view, and a **Quick exit**
  button. **Share my trip** sends a live link (`/trip/<id>`) by WhatsApp, SMS or the share sheet to
  someone the passenger trusts. Only the latest position is stored, it is wiped when sharing stops,
  and sharing ends by itself after 6 hours. Admins see quick reports flagged as "Safety mode".
- **Emergency shortcut**: while a passenger describes what happened (report form and safety mode),
  call buttons for Police 119, Ambulance 1990 and Fire 110 appear as soon as the text sounds like an
  emergency. It checks keywords in English, Sinhala, Tamil and Singlish instantly, even offline. With
  `GEMINI_API_KEY` set, an AI check catches what keywords miss. The passenger can dismiss it and
  carry on filing.

**Bus, other vehicle or the road (one report form)**

- **What was involved?** The report form (`/submit-report`) starts by asking whether it was **a bus**,
  **another vehicle** or **the road itself**:
  - **A bus**: which service (**private bus**, **SLTB bus** or **Metro Bus**), then the bus number,
    route (and the bus name for private buses) and the bus complaint categories, as before. The
    service is kept with the report and shown on the tracking page, admin screens and PDF receipt.
  - **Another vehicle**: the kind of vehicle (car, van, lorry, tipper, three-wheeler, motorcycle,
    tour or staff bus, school van, taxi, government vehicle, tractor), and if seen, the number
    plate (even part of it), colour and make. Then what happened (dangerous overtaking, speeding,
    drunk driving, jumping a red light, no helmet, black smoke, illegal parking, hit and run,
    accident…). There is no bus number or route.
  - **The road itself**: what is wrong with the road.

  Other-vehicle and road reports are filed as a separate report type ("road incident") with the same
  receipt, tracking page and updates. Old `/report-incident` links open the form with "Another
  vehicle" chosen.

- **Accidents**: whether the passenger was in it or saw it, whether anyone was hurt and how many
  vehicles were involved. Choosing "Serious injuries" brings up the 119 / 1990 call buttons straight
  away. The PDF receipt lists the vehicle and plate, so it can go to the police or an insurer.
- **Road hazards**: potholes, broken traffic lights, street lights out, flooding, fallen trees,
  landslides, missing signs, debris and animals on the road. No vehicle is asked for.
- **Dashcam video**: videos can now be up to 30 MB each (photos stay at 10 MB), on every report form.
- **Kept apart from buses**: road incidents never count in bus complaint figures, the impact page,
  scorecards, the heatmap or the operator portal, even when the vehicle is a bus. Admins get a
  **Road incidents** tab with its own totals (and accidents with serious injuries), can search by
  plate, and see the most reported kind of vehicle on Analytics.
- **Plates stay private**: the plate is stored in the report's details and shown to admins only.
  The tracking page, shared links and the preview image never include it.

Status changes and messages go out on every channel the passenger gave (email, SMS, WhatsApp, push, Telegram), in their
language; the admin sees which ones reached them.

The admin **Analytics** page tracks the Phase 1 success metrics: form completion rate, return visits to
tracking, average outcome rating, reports from QR codes and time to first response (anonymous daily
counts, no personal data), plus messages, passenger replies, My reports sign-ins, push sign-ups, "me too" confirmations,
fare checks, safety-mode reports, shared trips and how often the emergency shortcut appeared.

| App                 | What it is                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| [`api/`](api)       | REST API: TypeScript, Express 5, PostgreSQL                                                        |
| [`ui/`](ui)         | Web app: TypeScript, Next.js 16, MUI 9                                                             |
| [`mobile/`](mobile) | Passenger app for Android and iOS: Expo SDK 58, React Native (its own npm project; see its README) |

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
| Emails (receipts, codes) | `EMAIL_SERVICE_*`, `EMAIL_FROM`                              | Skipped (codes printed in dev)                    |
| SMS / WhatsApp           | `SMS_PROVIDER` + `ANDROID_SMS_*`, `NOTIFYLK_*` or `TWILIO_*` | Phone field hidden (in dev: shown, texts printed) |
| Telegram                 | `TELEGRAM_BOT_TOKEN` (+ `TELEGRAM_WEBHOOK_SECRET` hosted)    | The Telegram card is hidden                       |
| WhatsApp bot             | `WHATSAPP_*` (see below), `GEMINI_API_KEY` for the chat      | WhatsApp buttons are hidden                       |
| AI help + helper chat    | `GEMINI_API_KEY` (free), `AI_CHAT_ENABLED`                   | The AI panel and the helper chat are hidden       |
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

### Supabase (hosted PostgreSQL)

TransitX talks to Supabase as plain PostgreSQL (no Supabase client library):

1. Create a project and open **Connect**. Put the **Transaction pooler** string (port 6543) in
   `DATABASE_URL` and the **Session pooler** (port 5432) or **Direct connection** string in
   `DATABASE_DIRECT_URL`. URL-encode special characters in the password.
2. Run `npm run db:migrate`. It creates every table through `DATABASE_DIRECT_URL`.
3. Start the API. The connection is encrypted automatically. To verify Supabase's certificate as well,
   download it (**Project Settings → Database → SSL Configuration**) into `DATABASE_CA_CERT`.

Every table has row level security on with no policies, so Supabase's auto-generated Data API can't
read or change anything with the public anon key. The app connects as the tables' owner and isn't
affected. You can also turn the Data API off under **Project Settings → Data API**. New tables need
`.enableRLS()` in `schema.ts`; a test fails otherwise.

### Email (SMTP)

Set `EMAIL_SERVICE_HOST`, `EMAIL_SERVICE_PORT`, `EMAIL_SERVICE_USER`, `EMAIL_SERVICE_PASS` and
`EMAIL_FROM` (see `.env.example` for Brevo, Resend and Gmail). Port 465 uses SSL and 587 uses STARTTLS.
Supabase's own email service only sends Supabase Auth emails and can't send TransitX's receipts and
updates. `npm run email:test` checks the login, and `npm run email:test -- you@example.com` also sends a
test message. The API logs "SMTP server ready." at startup when the settings work.

### Site theme

Pick the look with `NEXT_PUBLIC_THEME` in `.env`, then restart `npm run dev` (or rebuild):

| Value              | Look                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `sunset` (default) | **Lanka Sunset**: crimson to saffron gradients on warm cream, teal accents |
| `aurora`           | **Midnight Aurora**: indigo, violet and pink glows on deep navy            |
| `emerald`          | **Emerald Trust**: calm civic greens with a gold accent                    |
| `classic`          | **Classic Blue**: the original TransitX blue and violet                    |

Each theme has light and dark modes (the visitor's switch in the header). Themes live in
`ui/src/theme/themes.ts`; add one there and to `THEME_NAMES` to make a new choice.

### WhatsApp bot

1. In [Meta for Developers](https://developers.facebook.com/apps), create an app of type **Business**
   and add the **WhatsApp** product. Its test number works straight away for up to five of your own
   numbers; add a real number (one not already on the WhatsApp app) for the public.
2. In **WhatsApp > API Setup**, copy the **phone number ID** to `WHATSAPP_PHONE_NUMBER_ID`. Create a
   permanent token (Business settings > System users > generate a token with `whatsapp_business_messaging`)
   for `WHATSAPP_ACCESS_TOKEN`. Copy **App settings > Basic > App secret** to `WHATSAPP_APP_SECRET`.
3. Choose any `WHATSAPP_VERIFY_TOKEN`, then in **WhatsApp > Configuration** set the callback URL to
   `https://<your site>/api/whatsapp/webhook` with that token, and subscribe to the **messages** field.
   Meta needs a public HTTPS URL: locally, use a tunnel such as `cloudflared tunnel --url http://localhost:3000`.
4. Set `WHATSAPP_DISPLAY_NUMBER` (e.g. `+94771234567`) so the site shows "Chat on WhatsApp" buttons, and
   `GEMINI_API_KEY` so the bot can chat (without it, it only tracks reports).
5. Optional: WhatsApp only allows free-form messages within 24 hours of the passenger's last message.
   For later updates, create a **Utility** message template (e.g. `report_update`, body
   `TransitX update for report {{1}}: {{2}}`, in English and, if you like, Sinhala `si` and Tamil `ta`),
   and set `WHATSAPP_UPDATE_TEMPLATE` to its name once Meta approves it.

Replies to passengers' messages are free. Template messages are charged by Meta per message.

## Scripts

| Script                                | Does                                                      |
| ------------------------------------- | --------------------------------------------------------- |
| `dev` (`dev:api`, `dev:ui`)           | Run both apps with reload                                 |
| `build` (`build:api`, `build:ui`)     | Compile the API to `api/dist`, build the UI to `ui/.next` |
| `start` / `start:ui`                  | Run the compiled API / serve the built UI                 |
| `test` (`test:api`, `test:ui`)        | Vitest: API tests and UI component tests                  |
| `lint`, `typecheck`, `format(:check)` | ESLint, TypeScript, Prettier                              |
| `db:migrate`, `db:generate`           | Apply / create database migrations                        |
| `email:test [address]`                | Check the SMTP settings (and send a test email)           |
| `db:seed [--reset] [--allow-remote]`  | Fill a local database with sample data (see below)        |

CI runs `format:check`, `lint`, `typecheck`, `test` and `build` on every push and pull request.

### Sample data

`npm run db:seed` fills a migrated, empty database with made-up data for development and demos:
about 220 reports of every type over the last ten months, with timelines, notes, messages, "me too"
confirmations, operator replies and ratings. It also adds impact stories in all three languages,
fare tables and routes, a live shared trip, daily usage counters, three staff accounts
(`superadmin@`, `admin@`, `moderator@example.com`) and five operator accounts. Every account's
password is `TransitX-dev-2026` (set `SEED_PASSWORD` to change it), and the script prints them all.

The data is the same on every run, with dates relative to today. The fare tables are illustrative,
not the official NTC fares. The script refuses to run when `NODE_ENV=production`, against a database
that isn't on this machine unless you pass `--allow-remote`, and on a database that already has
accounts or reports unless you pass `--reset`, which wipes every table first.

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
`DATABASE_URL` should point to a hosted Postgres (for Supabase, the transaction pooler, with
`DATABASE_DIRECT_URL` for migrations; see above). Migrations run during the build.
`vercel-build` is run by both builders: the Next.js builder (which sets `NEXT_PRIVATE_TARGET`) builds the
UI, and the API builder applies the migrations. Running `next build` a second time would delete the files
Vercel's adapter wrote during the first build and fail the deploy.
