# BusWatch Architecture

BusWatch is a monorepo with two TypeScript apps, one root `package.json` (one install, one
`node_modules`) and one root `.env`:

| App    | Stack                                                                                                             | Entry point     |
| ------ | ----------------------------------------------------------------------------------------------------------------- | --------------- |
| `api/` | Node.js 24, Express 5, PostgreSQL 18 (Drizzle ORM + node-postgres), Zod 4, Helmet, Cloudinary, Nodemailer, PDFKit | `src/server.ts` |
| `ui/`  | Next.js 16 (App Router), React 19, MUI 9, MUI X Data Grid & Charts, TanStack Query 5, Axios                       | `src/app/`      |

**Shared tooling:** TypeScript 6 (strict), ESLint 10 (flat config with typescript-eslint),
Prettier 3 (root `.prettierrc.json`), Vitest 5, GitHub Actions CI (`.github/workflows/ci.yml`),
Dependabot, and Node 24 (`.nvmrc`).

> TypeScript stays on 6.0.x until typescript-eslint supports TypeScript 7.

## Backend: layered structure

```
api/
├── src/
│   ├── server.ts             # Entry point (Node, Docker, Vercel): DB connect, listen
│   ├── app.ts                # createApp(): Helmet, CORS, JSON, routes, error handling
│   ├── config/               # env.ts (validated env), db, cloudinary, constants (shared enums)
│   ├── db/                   # schema.ts (tables, enums, relations), client.ts, migrate.ts
│   ├── repositories/         # All database queries                → <entity>.repository.ts
│   ├── validators/           # Zod request schemas + inferred types → <entity>.validator.ts
│   ├── routes/               # URL → middleware → handler         → <entity>.routes.ts, index.ts
│   ├── controllers/          # Request/response handling           → <entity>.controller.ts
│   ├── middleware/           # Express middleware                  → <name>.middleware.ts
│   ├── services/             # Side effects: email, PDF, startup   → <name>.service.ts
│   ├── i18n/                 # Email and PDF text in English, Sinhala and Tamil
│   ├── utils/                # Small pure helpers                  → <name>.ts
│   └── types/                # Global type augmentation (e.g. req.admin)
├── assets/fonts/             # Noto Sans Sinhala/Tamil for PDF receipts (OFL; shipped in Docker and Vercel)
├── drizzle/                  # Generated SQL migrations (commit them; never edit applied ones)
├── drizzle.config.ts         # drizzle-kit settings
└── tests/                    # Vitest + Supertest API tests on PGlite (in-process PostgreSQL)
```

A request goes `routes → middleware (auth, rate limit, upload, validateBody) → controller → repository/service`.

- **Validation lives in Zod schemas**, not controllers. `validateBody(schema)` replaces `req.body`
  with the parsed value, so controllers receive trimmed, typed input (`Request<Params, object, Input>`).
- **Configuration is read once** through `config/env.ts`. It validates `process.env` at startup and
  fails fast with a list of problems. Never read `process.env` anywhere else.
- **Async errors**: Express 5 forwards rejected promises to `errorHandler`, so handlers don't
  need try/catch unless a failure must be tolerated (e.g. email after a report is saved).
- **Database access only in repositories.** Controllers call functions like `findReportById` and
  never build queries. Multi-step writes (a report and its first timeline entry, a status change and
  its history row) run in a transaction.
- **Schema changes**: edit `src/db/schema.ts`, run `npm run db:generate` to create a migration in
  `api/drizzle/`, review the SQL, commit it. `npm run db:migrate` (also run by `dev:api`, the Docker
  image and the Vercel build) applies it.
- **Testing**: `createApp()` builds the app without connecting or listening; tests use it with Supertest.
  `tests/setup.ts` replaces the database client with PGlite, migrated with the same SQL files.

**Naming**

- Files are `kebab-case` with a layer suffix: `report.controller.ts`, `rate-limit.middleware.ts`.
- ESM with `"type": "module"`: relative imports end in `.js` (TypeScript NodeNext resolution).
- Entities are singular in code (`report`, `admin`); tables are plural snake_case (`reports`,
  `report_status_changes`). Columns are camelCase in TypeScript and snake_case in SQL.
- Shared enums (statuses, categories, roles, upload limits) live only in `src/config/constants.ts`.

## Frontend: Next.js App Router + Atomic Design

```
ui/
├── next.config.ts            # Loads the root .env, /api rewrite, standalone output
├── messages/                 # en.json, si.json, ta.json: all public UI text (next-intl)
├── public/                   # Static files (hero image, icons, manifest, sw.js service worker)
└── src/
    ├── app/                  # Routes only: layouts, page.tsx files, metadata
    │   ├── layout.tsx        # <html>, font, colour-scheme script, MUI cache provider
    │   ├── providers.tsx     # Client providers: Theme, TanStack Query, Auth
    │   ├── (site)/           # Public pages inside the site header/footer
    │   └── admin/            # login/ and (console)/ (guarded, with the sidebar)
    ├── views/                # Screen components rendered by page.tsx → <Name>View.tsx
    │   ├── public/           # Home, Submit, Track, About, Privacy, Terms
    │   └── admin/            # Login, Dashboard, Report details, Analytics
    ├── i18n/                 # Locale cookie / Accept-Language negotiation, next-intl request config
    ├── api/                  # HTTP calls, one file per resource → <resource>Api.ts; apiClient.ts is shared
    ├── hooks/                # useAuth, useReportQueries (TanStack Query hooks + query keys), useIsClient
    ├── lib/                  # queryClient, tokenStore (admin token in localStorage), format helpers
    ├── context/              # authContext.ts (context object) + AuthProvider.tsx
    ├── constants/            # Enums and label helpers → <topic>Constants.ts
    ├── types/                # Domain types shared by API and UI → <topic>.ts
    ├── theme/                # MUI theme: light + dark colour schemes as CSS variables
    ├── test/                 # Test setup (next/navigation mock) and render helpers
    └── components/
        ├── atoms/            # BrandMark, GradientButton, StatusChip, ColorModeToggle
        ├── molecules/        # StatTile, SectionPanel, MediaDropzone, MonthlyTrendChart, StatusDonut, ...
        ├── organisms/        # SiteHeader, SiteFooter, AdminNavigation, AdminGuard, ManageAdminsDialog
        └── templates/        # PublicLayout, AdminLayout, HeroBand, ContentPageTemplate
```

**Routes and views.** A `page.tsx` stays thin: it exports `metadata`, reads route params and renders a
view. Views that need state, queries or browser APIs start with `"use client"`; static content views
(Home, About, Privacy, Terms) are server components and are prerendered. (The folder is `views/`, not
`pages/`, because Next treats `src/pages` as the Pages Router.)

**Server and client components.** Props passed from a server component to a client one must be
serialisable: no functions, so no `sx` callbacks or `component={Link}` there. Links use `href` only;
the theme makes `next/link` the default link component of `Button`, `ListItemButton` and `Link`.

**Admin session.** The token lives in `localStorage` (`lib/tokenStore.ts`), so admin screens are
client-rendered. `AdminGuard` waits for the session check, then redirects to
`/admin/login?next=<path>` if needed. The server never knows the session.

**Which level does a component belong to?**

- **Atom**: one element with styling and a few props. It knows nothing about the API.
  It may read shared constants for display only (e.g. `StatusChip` maps a status to its label and colour).
- **Molecule**: a small group of atoms with one job, configured through props. No API calls.
- **Organism**: a distinct section of a page, often reused, which may use query hooks (e.g. `ManageAdminsDialog`).
- **Template**: arranges organisms and page content; holds layout only, no data.
- **View**: fills a template with real data; rendered by a route's `page.tsx`.

A component may only import from its own level or lower levels (views → templates → organisms →
molecules → atoms). Styling that only one page uses stays in that page file. Once a second page
needs it, promote it to the right level.

**Server state: TanStack Query.** Views never fetch inside `useEffect`. They call hooks from
`hooks/useReportQueries.ts` (`useReportList`, `useReport`, `useUpdateReportStatus`, …). That module
owns the query keys, so a mutation can update or invalidate exactly the caches it affects. Local UI
state (form fields, dialogs) stays in `useState`.

**Errors**: every API helper throws `ApiError` (an `Error` with `status`). Show them with
`errorMessage(error, fallback)`.

**Naming**

- Components are `PascalCase.tsx`, one component per file, file named after the component.
- Views end in `View`, route components in `Page`, templates in `Template` or `Layout`, hooks start with `use`.
- Import with the `@/` alias (`@/components/atoms`), which maps to `ui/src`.
- Non-component modules are `camelCase.ts` with a role suffix: `reportApi.ts`, `reportConstants.ts`.
- Tests sit next to the code they test: `StatusChip.test.tsx`.
- Each level in `components/` has an `index.ts` barrel. Import from the level, not the file:
  `import { GradientButton, StatusChip } from "@/components/atoms";`
- Read auth state with `useAuth()`, not `useContext(AuthContext)`.
- `styled()` wrappers that need MUI's `component` prop are cast back to the base type
  (`as typeof Button`) so the prop stays typed.
- Colours come from the theme (`primary.main`) or its CSS variables
  (`rgba(var(--mui-palette-primary-mainChannel) / 0.1)`), so both colour schemes work.

**Languages (next-intl).** The public site is in English, Sinhala and Tamil. The language comes from
the `NEXT_LOCALE` cookie, else `Accept-Language`; URLs have no locale prefix, so emailed links and QR
stickers work in every language. Reading the cookie makes public pages render per request rather than
being prerendered. Text lives in `ui/messages/*.json`; keys are type-checked against `en.json`
(`types/next-intl.d.ts`) and `i18n/messages.test.ts` fails if a translation is missing or drops a
placeholder. Missing keys fall back to English. The admin console stays in English. Translations were
written by the development team and should be reviewed by native speakers.

**Offline and installable.** `public/sw.js` (hand-written, no build plugin) serves pages network-first
with a cached fallback and `/offline`, and caches hashed static assets. It never caches `/api`, `/admin`
or `/r`. Forms save drafts to IndexedDB (`lib/offlineStore.ts`, `hooks/useFormDraft.ts`); reports sent
without a connection go to an outbox that `OfflineOutbox` (mounted in `PublicLayout`) sends when the
browser is back online. The worker only registers in production builds.

**Metrics.** `trackEvent()` (`api/metricsApi.ts`) counts anonymous events (form started, tracking
visit, QR scan, share, ...) as daily totals in `daily_metrics`. Submissions are counted by the API.

**Public results.** `/api/public/*` (`public.repository.ts`) returns aggregates only, and every query
applies the same rules: a report counts once an admin has checked it (`PUBLIC_STATUSES`: reviewed,
escalated, resolved) and not hidden it (`hiddenFromPublic`); buses and routes need `MIN_PUBLIC_REPORTS`
checked reports for a scorecard; heatmap cells need `MIN_HEATMAP_REPORTS`. Responses are cached in
memory for five minutes (`utils/ttl-cache.ts`, cleared when admins change stories or visibility) and
the Next pages cache their fetches for the same time (`lib/serverApi.ts`). Never add receipt IDs,
descriptions, contact details or exact times to these endpoints. The heatmap is plain SVG over a
Natural Earth outline (`constants/sriLankaOutline.ts`), so no map key or third-party tracking is needed.

**Two-way contact.** `notification.service.ts` sends a status change or team message to the passenger
on every channel they gave: email (`email.service.ts`), SMS (`sms.service.ts`: an Android phone running SMS
Gateway for Android, Notify.lk or Twilio, picked by `SMS_PROVIDER`), Telegram (`telegram.service.ts`)
and Web Push (`push.service.ts`, one `push_subscriptions` row per device and
report). Each channel is best-effort and the result (`delivery`) goes back to the admin. Messages live in
`report_messages` with a `readAt` per side. The passenger's key to a report stays its receipt ID, as for
ratings; replies close `REPLY_WINDOW_DAYS` after the report does.
`GET /api/passenger/channels` tells the UI which channels are on, so it hides the phone field without
SMS and the Telegram card without a bot.

Telegram: the tracking page fetches a `t.me/<bot>?start=<token>` link, where the token is the receipt ID,
an expiry and an HMAC (valid a day). Pressing Start sends `/start <token>` to the bot; the chat is saved
in `telegram_subscriptions` (private chats only) and `/stop` deletes it. The API receives bot messages by
long polling, started from `server.ts`, or by webhook (`POST /api/telegram/webhook`, checked against
`TELEGRAM_WEBHOOK_SECRET`) on serverless hosts. Chats that block the bot are forgotten.

"My reports" uses passwordless sessions: `passenger_codes` stores an HMAC of each 6-digit code (10 min,
5 tries, 3 codes per contact per 15 min), and `POST /api/passenger/code` answers the same whether or
not the contact has reports. The session is a JWT with its own audience, sent as `x-passenger-token`;
`requireAuth` rejects any token without an admin claim, so the two sessions never mix. Phone numbers are
stored in E.164 (`utils/phone.ts`, mirrored in `ui/src/lib/phone.ts`).

The service worker shows push notifications and posts `report-updated` to open tabs so the tracking
page refreshes. In development `lib/push.ts` registers it as `/sw.js?mode=push-only`, which skips the
page cache.

**CAPTCHA.** `verifyTurnstile` runs on report submission when `TURNSTILE_SECRET_KEY` is set. The browser
fetches a fresh token right before each send (`lib/turnstile.ts`), including reports sent later from the
offline outbox; a failed check keeps the report in the outbox instead of dropping it.

## Cross-cutting conventions

- Status, category, type and language enums in `api/src/config/constants.ts` must match
  `ui/src/constants/reportConstants.ts`. Category and status names are translated twice: in
  `api/src/i18n/messages.ts` (emails, PDF) and `ui/messages/*.json` (site).
- One `.env` at the repo root (template: `.env.example`). The API reads all of it; Next only exposes
  `NEXT_PUBLIC_*` variables to the browser.
- Dependencies: the API's runtime packages are `dependencies`; UI libraries and tooling are
  `devDependencies` (Next bundles the UI into a standalone server), so the API image installs with `--omit=dev`.
- The UI calls same-origin `/api`. Next rewrites (dev, Docker) and Vercel routes forward it to the API.
- Before pushing: `npm run lint && npm run typecheck && npm test` at the root (CI runs the same,
  plus `format:check` and `build`).
