# BusWatch Architecture

BusWatch is two deployable apps in one repo:

| App | Stack | Entry point |
|---|---|---|
| `buswatch-backend/` | Node.js, Express 5, MongoDB (Mongoose), Cloudinary, Nodemailer, PDFKit | `server.js` |
| `buswatch-frontend/` | React 19 (Create React App), MUI v7, React Router 7 | `src/index.js` |

## Backend: layered structure

```
buswatch-backend/
├── server.js                 # Entry point (Node, Docker, Vercel): env check, DB connect, listen
└── src/
    ├── app.js                # Express app: CORS, body parsing, routes, error handling
    ├── config/               # Connections and shared enums (db, cloudinary, constants)
    ├── models/               # Mongoose schemas         → <entity>.model.js
    ├── routes/               # URL → middleware → handler → <entity>.routes.js, index.js mounts them
    ├── controllers/          # Request/response handling → <entity>.controller.js
    ├── middleware/           # Express middleware       → <name>.middleware.js
    ├── services/             # Work with side effects: email, PDF, startup tasks → <name>.service.js
    └── utils/                # Small pure helpers       → <name>.js
```

A request goes `routes → middleware → controller → model/service`. Controllers parse and validate
input and shape the response. Anything that talks to a third party (email, PDF, Cloudinary uploads
that outlive one request) belongs in a service.

**Naming**
- Files are `kebab-case` with a layer suffix: `report.controller.js`, `rate-limit.middleware.js`,
  `pdf-receipt.service.js`. The suffix makes the layer obvious in search results and tabs.
- Entities are singular: `report`, `admin`.
- Shared enums (statuses, categories, roles) live only in `src/config/constants.js`.

## Frontend: Atomic Design

```
buswatch-frontend/src/
├── index.js, App.js          # Providers and the route table
├── api/                      # HTTP calls, one file per resource → <resource>Api.js; apiClient.js is shared
├── constants/                # Enums and label helpers           → <topic>Constants.js
├── context/                  # React context providers           → <Name>Context.js
├── hooks/                    # Custom hooks                      → use<Name>.js
├── routes/                   # Route guards                      → PrivateRoute.js
├── theme/                    # MUI theme
├── assets/                   # Images
├── components/
│   ├── atoms/                # Smallest UI pieces, no app state: GradientButton, FormTextField, StatusChip
│   ├── molecules/            # A few atoms working together: LoadingState, DetailRow, StatTile, LocationPicker
│   ├── organisms/            # Self-contained sections, may fetch data: Header, Footer, ManageAdminsDialog
│   └── templates/            # Page layouts with no data: MainLayout, ContentPageTemplate
└── pages/                    # Route-level screens that own data fetching and state
    ├── public/               # Anyone: Home, Submit, Track, About, Privacy, Terms
    └── admin/                # Signed-in admins: Login, Dashboard, Report details, Analytics
```

**Which level does a component belong to?**
- **Atom**: one element with styling and a few props. It knows nothing about reports or the API.
  It may read shared constants for display only (e.g. `StatusChip` maps a status to its label and colour).
- **Molecule**: a small group of atoms with one job, configured through props. No API calls.
- **Organism**: a distinct section of a page, often reused, which may call the API (e.g. `ManageAdminsDialog`).
- **Template**: arranges organisms and page content; holds layout only, no data.
- **Page**: fills a template with real data; the only level wired to routes.

A component may only import from its own level or lower levels (pages → templates → organisms →
molecules → atoms). Styling that only one page uses stays in that page file. Once a second page
needs it, promote it to the right level.

**Naming**
- Components are `PascalCase`, one component per file, file named after the component.
- Pages end in `Page`, templates in `Template` or `Layout`, hooks start with `use`.
- Non-component modules are `camelCase` with a role suffix: `reportApi.js`, `reportConstants.js`.
- Each level in `components/` has an `index.js` barrel. Import from the level, not the file:
  `import { GradientButton, StatusChip } from "../../components/atoms";`
- Read auth state with `useAuth()`, not `useContext(AuthContext)`.

## Cross-cutting conventions
- Backend status and category enums in `src/config/constants.js` must match
  `src/constants/reportConstants.js` in the frontend.
- All frontend HTTP calls go through `api/apiClient.js`, which reads `REACT_APP_BACKEND_URL` and attaches
  the admin token.
- Environment variables are documented in `buswatch-backend/.env.example`.
