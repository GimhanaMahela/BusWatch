import bcrypt from "bcryptjs";
import { asc, count, eq } from "drizzle-orm";
import type { AdminRole } from "../config/constants.js";
import { db } from "../db/client.js";
import { admins, type AdminRow } from "../db/schema.js";

export type PublicAdmin = Omit<AdminRow, "passwordHash">;

/** Never send the password hash anywhere */
export const toPublicAdmin = ({ passwordHash: _hash, ...admin }: AdminRow): PublicAdmin => admin;

export const findAdminByEmail = async (email: string) =>
  db.query.admins.findFirst({ where: eq(admins.email, email.toLowerCase()) });

export const findAdminById = async (id: string) =>
  db.query.admins.findFirst({ where: eq(admins.id, id) });

export const listAdmins = async (): Promise<PublicAdmin[]> =>
  (await db.select().from(admins).orderBy(asc(admins.createdAt))).map(toPublicAdmin);

export const createAdmin = async (input: {
  email: string;
  password: string;
  role: AdminRole;
}): Promise<AdminRow> => {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [admin] = await db
    .insert(admins)
    .values({ email: input.email.toLowerCase(), passwordHash, role: input.role })
    .returning();
  if (!admin) throw new Error("Admin insert returned no row");
  return admin;
};

export const verifyPassword = (admin: AdminRow, password: string) =>
  bcrypt.compare(password, admin.passwordHash);

export const countAdmins = async (): Promise<number> => {
  const [row] = await db.select({ value: count() }).from(admins);
  return row?.value ?? 0;
};

/** Makes the oldest admin a superadmin when none exists; returns their email. */
export const ensureSuperadmin = async (): Promise<string | null> => {
  const existing = await db.query.admins.findFirst({ where: eq(admins.role, "superadmin") });
  if (existing) return null;
  const oldest = await db.query.admins.findFirst({ orderBy: asc(admins.createdAt) });
  if (!oldest) return null;
  await db.update(admins).set({ role: "superadmin" }).where(eq(admins.id, oldest.id));
  return oldest.email;
};
