# BusWatch

Passengers report public transport incidents (reckless driving, overcharging, harassment, …) with
photos, videos and a map pin, get a receipt ID, and track what happens to their report. Admins
review, escalate and resolve reports, keep internal notes, and see analytics such as repeat-offender buses.

| App           | What it is                               |
| ------------- | ---------------------------------------- |
| [`api/`](api) | REST API: TypeScript, Express 5, MongoDB |
| [`ui/`](ui)   | Web app: TypeScript, React 19, Vite, MUI |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the structure, naming conventions and tech stack.

## Quick start (local)

Requires Node.js 24 (`nvm use`) and MongoDB.

```bash
# API on http://localhost:5000
cd api
cp .env.example .env        # set JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI
npm install
npm run dev

# Web app on http://localhost:3000
cd ../ui
cp .env.example .env.local
npm install
npm run dev
```

On first start the API creates a superadmin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Other admins are
added from the dashboard's **Admins** dialog.

## Docker

```bash
cp api/.env.example api/.env   # fill in secrets
docker compose up --build
```

The web app runs on http://localhost:3000, the API on http://localhost:5000 and MongoDB on port 27017.

## Checks

Each app has the same scripts, and CI runs them on every push and pull request:

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm test              # Vitest
npm run format:check  # Prettier
npm run build
```
