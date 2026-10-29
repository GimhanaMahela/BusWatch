# BusWatch API

TypeScript REST API for BusWatch: Express 5, MongoDB (Mongoose 9), Zod validation, Cloudinary media,
PDF receipts (PDFKit) and email (Nodemailer). See [../ARCHITECTURE.md](../ARCHITECTURE.md).

## Setup

```bash
cp .env.example .env   # JWT_SECRET and MONGO_URI are required; see comments in the file
npm install
npm run dev            # http://localhost:5000, reloads on change
```

Production: `npm run build && npm start` (runs `dist/server.js`). The `Dockerfile` does both.
On Vercel, `vercel.json` serves `src/server.ts` as a serverless function.

## Scripts

| Script                        | Does                                              |
| ----------------------------- | ------------------------------------------------- |
| `dev`                         | Run with reload (`tsx watch`), loading `.env`     |
| `build` / `start`             | Compile to `dist/` / run the compiled server      |
| `test`                        | API tests (Vitest + Supertest, in-memory MongoDB) |
| `lint`, `typecheck`, `format` | ESLint, `tsc --noEmit`, Prettier                  |

## API

| Method & path                                      | Access               | Purpose                                                 |
| -------------------------------------------------- | -------------------- | ------------------------------------------------------- |
| `POST /api/reports`                                | Public, rate-limited | Submit a report (multipart: fields, `images`, `videos`) |
| `GET /api/reports/track/:receiptId`                | Public, rate-limited | Status and timeline for a receipt ID                    |
| `GET /api/reports`                                 | Admin                | List with `page, limit, status, category, q, from, to`  |
| `GET /api/reports/stats`                           | Admin                | Dashboard analytics                                     |
| `GET /api/reports/:id` · `/receipt/:receiptId`     | Admin                | One report                                              |
| `PUT /api/reports/:id/status`                      | Admin                | Change status, optional message to the passenger        |
| `POST /api/reports/:id/notes`                      | Admin                | Add an internal note                                    |
| `DELETE /api/reports/:id`                          | Admin                | Delete a report and its media                           |
| `POST /api/auth/login`                             | Public, rate-limited | Get a JWT (send it as `x-auth-token`)                   |
| `GET /api/auth`                                    | Admin                | Current admin                                           |
| `GET /api/auth/admins` · `POST /api/auth/register` | Superadmin           | List / create admins                                    |
| `GET /health`                                      | Public               | Health check                                            |
