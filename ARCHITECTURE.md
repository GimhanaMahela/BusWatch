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
│   ├── utils/                # Small pure helpers                  → <name>.ts
│   └── types/                # Global type augmentation (e.g. req.admin)
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
├── public/                   # Static files (hero image, icons, manifest)
└── src/
    ├── app/                  # Routes only: layouts, page.tsx files, metadata
    │   ├── layout.tsx        # <html>, font, colour-scheme script, MUI cache provider
    │   ├── providers.tsx     # Client providers: Theme, TanStack Query, Auth
    │   ├── (site)/           # Public pages inside the site header/footer
    │   └── admin/            # login/ and (console)/ (guarded, with the sidebar)
    ├── views/                # Screen components rendered by page.tsx → <Name>View.tsx
    │   ├── public/           # Home, Submit, Track, About, Privacy, Terms
    │   └── admin/            # Login, Dashboard, Report details, Analytics
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

## Cross-cutting conventions

- Status and category enums in `api/src/config/constants.ts` must match
  `ui/src/constants/reportConstants.ts`.
- One `.env` at the repo root (template: `.env.example`). The API reads all of it; Next only exposes
  `NEXT_PUBLIC_*` variables to the browser.
- Dependencies: the API's runtime packages are `dependencies`; UI libraries and tooling are
  `devDependencies` (Next bundles the UI into a standalone server), so the API image installs with `--omit=dev`.
- The UI calls same-origin `/api`. Next rewrites (dev, Docker) and Vercel routes forward it to the API.
- Before pushing: `npm run lint && npm run typecheck && npm test` at the root (CI runs the same,
  plus `format:check` and `build`).
