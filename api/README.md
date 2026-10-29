# BusWatch API

TypeScript REST API: Express 5, MongoDB (Mongoose 9), Zod validation, Cloudinary media, PDF receipts
(PDFKit) and email (Nodemailer). Setup and scripts are in the [root README](../README.md); structure
and conventions in [ARCHITECTURE.md](../ARCHITECTURE.md).

## Endpoints

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
