# BusWatch Architecture

BusWatch is a monorepo with two TypeScript apps, one root `package.json` (one install, one
`node_modules`) and one root `.env`:

| App    | Stack                                                                                      | Entry point     |
| ------ | ------------------------------------------------------------------------------------------ | --------------- |
| `api/` | Node.js 24, Express 5, MongoDB (Mongoose 9), Zod 4, Helmet, Cloudinary, Nodemailer, PDFKit | `src/server.ts` |
| `ui/`  | React 19, Vite 8, MUI 9, React Router 8, TanStack Query 5, Axios                           | `src/main.tsx`  |

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
│   ├── models/               # Mongoose schemas + TS interfaces   → <entity>.model.ts
│   ├── validators/           # Zod request schemas + inferred types → <entity>.validator.ts
│   ├── routes/               # URL → middleware → handler         → <entity>.routes.ts, index.ts
│   ├── controllers/          # Request/response handling           → <entity>.controller.ts
│   ├── middleware/           # Express middleware                  → <name>.middleware.ts
│   ├── services/             # Side effects: email, PDF, startup   → <name>.service.ts
│   ├── utils/                # Small pure helpers                  → <name>.ts
│   └── types/                # Global type augmentation (e.g. req.admin)
└── tests/                    # Vitest + Supertest API tests on an in-memory MongoDB
```

A request goes `routes → middleware (auth, rate limit, upload, validateBody) → controller → model/service`.

- **Validation lives in Zod schemas**, not controllers. `validateBody(schema)` replaces `req.body`
  with the parsed value, so controllers receive trimmed, typed input (`Request<Params, object, Input>`).
- **Configuration is read once** through `config/env.ts`. It validates `process.env` at startup and
  fails fast with a list of problems. Never read `process.env` anywhere else.
- **Async errors**: Express 5 forwards rejected promises to `errorHandler`, so handlers don't
  need try/catch unless a failure must be tolerated (e.g. email after a report is saved).
- **Testing**: `createApp()` builds the app without connecting or listening; tests use it with Supertest.

**Naming**

- Files are `kebab-case` with a layer suffix: `report.controller.ts`, `rate-limit.middleware.ts`.
- ESM with `"type": "module"`: relative imports end in `.js` (TypeScript NodeNext resolution).
- Entities are singular (`report`, `admin`); models export `<Entity>Model` and an `<Entity>` interface.
- Shared enums (statuses, categories, roles, upload limits) live only in `src/config/constants.ts`.

## Frontend: Atomic Design

```
ui/src/
├── main.tsx, App.tsx         # Providers (Query, Router, Theme, Auth) and the lazy route table
├── api/                      # HTTP calls, one file per resource → <resource>Api.ts; apiClient.ts is shared
├── hooks/                    # useAuth, useReportQueries (TanStack Query hooks + query keys)
├── lib/                      # Library setup (queryClient)
├── context/                  # authContext.ts (context object) + AuthProvider.tsx
├── constants/                # Enums and label helpers → <topic>Constants.ts
├── types/                    # Domain types shared by API and UI → <topic>.ts
├── routes/                   # Route guards → PrivateRoute.tsx
├── theme/                    # MUI theme
├── test/                     # Test setup and render helpers
├── components/
│   ├── atoms/                # Smallest UI pieces, no app state: GradientButton, FormTextField, StatusChip
│   ├── molecules/            # A few atoms working together: LoadingState, DetailRow, StatTile, LocationPicker
│   ├── organisms/            # Self-contained sections, may fetch data: Header, Footer, ManageAdminsDialog
│   └── templates/            # Page layouts with no data: MainLayout, ContentPageTemplate
└── pages/                    # Route-level screens
    ├── public/               # Anyone: Home, Submit, Track, About, Privacy, Terms
    └── admin/                # Signed-in admins: Login, Dashboard, Report details, Analytics
```

**Which level does a component belong to?**

- **Atom**: one element with styling and a few props. It knows nothing about the API.
  It may read shared constants for display only (e.g. `StatusChip` maps a status to its label and colour).
- **Molecule**: a small group of atoms with one job, configured through props. No API calls.
- **Organism**: a distinct section of a page, often reused, which may use query hooks (e.g. `ManageAdminsDialog`).
- **Template**: arranges organisms and page content; holds layout only, no data.
- **Page**: fills a template with real data; the only level wired to routes, and lazy-loaded.

A component may only import from its own level or lower levels (pages → templates → organisms →
molecules → atoms). Styling that only one page uses stays in that page file. Once a second page
needs it, promote it to the right level.

**Server state: TanStack Query.** Pages never fetch inside `useEffect`. They call hooks from
`hooks/useReportQueries.ts` (`useReportList`, `useReport`, `useUpdateReportStatus`, …). That module
owns the query keys, so a mutation can update or invalidate exactly the caches it affects. Local UI
state (form fields, dialogs) stays in `useState`.

**Errors**: every API helper throws `ApiError` (an `Error` with `status`). Show them with
`errorMessage(error, fallback)`.

**Naming**

- Components are `PascalCase.tsx`, one component per file, file named after the component.
- Pages end in `Page`, templates in `Template` or `Layout`, hooks start with `use`.
- Non-component modules are `camelCase.ts` with a role suffix: `reportApi.ts`, `reportConstants.ts`.
- Tests sit next to the code they test: `StatusChip.test.tsx`.
- Each level in `components/` has an `index.ts` barrel. Import from the level, not the file:
  `import { GradientButton, StatusChip } from "../../components/atoms";`
- Read auth state with `useAuth()`, not `useContext(AuthContext)`.
- `styled()` wrappers that need MUI's `component` prop are cast back to the base type
  (`as typeof Button`) so the prop stays typed.

## Cross-cutting conventions

- Status and category enums in `api/src/config/constants.ts` must match
  `ui/src/constants/reportConstants.ts`.
- One `.env` at the repo root (template: `.env.example`). The API reads all of it; Vite only exposes
  `VITE_*` variables to the browser.
- Dependencies: the API's runtime packages are `dependencies`; UI libraries and tooling are
  `devDependencies` (Vite bundles the UI), so the API image installs with `--omit=dev`.
- The UI calls same-origin `/api`. Vite (dev), nginx (Docker) and Vercel routes forward it to the API.
- Before pushing: `npm run lint && npm run typecheck && npm test` at the root (CI runs the same,
  plus `format:check` and `build`).
