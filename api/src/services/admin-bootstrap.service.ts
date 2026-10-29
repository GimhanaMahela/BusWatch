import { env } from "../config/env.js";
import { countAdmins, createAdmin, ensureSuperadmin } from "../repositories/admin.repository.js";

/**
 * Runs on startup: creates the first superadmin from ADMIN_EMAIL / ADMIN_PASSWORD,
 * and makes sure there is always at least one superadmin.
 */
export const createInitialAdmin = async (): Promise<void> => {
  try {
    if ((await countAdmins()) === 0) {
      if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
        console.warn(
          "No admins exist and ADMIN_EMAIL / ADMIN_PASSWORD are not set. Skipping initial admin creation.",
        );
        return;
      }
      await createAdmin({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        role: "superadmin",
      });
      console.log("Initial superadmin created successfully!");
      return;
    }

    const promoted = await ensureSuperadmin();
    if (promoted) console.log(`Promoted ${promoted} to superadmin.`);
  } catch (error) {
    console.error("Error creating initial admin:", error instanceof Error ? error.message : error);
  }
};
