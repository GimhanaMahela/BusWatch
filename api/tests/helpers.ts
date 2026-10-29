import { sql } from "drizzle-orm";
import request from "supertest";
import { beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { createAdmin } from "../src/repositories/admin.repository.js";

export const app = createApp();
export { db };

/** Empties every table before each test (the PGlite database itself is per test file). */
export const useTestDatabase = () => {
  beforeEach(async () => {
    await db.execute(sql`TRUNCATE admins, reports RESTART IDENTITY CASCADE`);
  });
};

export const createAdminAndLogin = async (
  email = "root@test.com",
  role: "superadmin" | "admin" = "superadmin",
) => {
  const password = "supersecret1";
  await createAdmin({ email, password, role });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token as string;
};

/** Submits a report through the public endpoint (multipart, like the real form). */
export const submitReport = (fields: Record<string, string> = {}) => {
  const req = request(app).post("/api/reports");
  const data = {
    busNumber: "ne-9999",
    routeNumber: "08",
    location: "Ambepussa Junction",
    description: "Driver was speeding",
    category: "reckless_driving",
    ...fields,
  };
  for (const [key, value] of Object.entries(data)) req.field(key, value);
  return req;
};
