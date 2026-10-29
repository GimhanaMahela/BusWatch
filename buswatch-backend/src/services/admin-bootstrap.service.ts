import { env } from "../config/env.js";
import { AdminModel } from "../models/admin.model.js";

/**
 * Runs on startup: creates the first superadmin from ADMIN_EMAIL / ADMIN_PASSWORD,
 * and makes sure databases created before roles existed still have one superadmin.
 */
export const createInitialAdmin = async (): Promise<void> => {
  try {
    const adminCount = await AdminModel.countDocuments();
    if (adminCount === 0) {
      if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
        console.warn(
          "No admins exist and ADMIN_EMAIL / ADMIN_PASSWORD are not set. Skipping initial admin creation.",
        );
        return;
      }
      await AdminModel.create({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
        role: "superadmin",
      });
      console.log("Initial superadmin created successfully!");
      return;
    }

    const superadminExists = await AdminModel.exists({ role: "superadmin" });
    if (!superadminExists) {
      const oldest = await AdminModel.findOne().sort({ _id: 1 });
      if (!oldest) return;
      oldest.role = "superadmin";
      await oldest.save();
      console.log(`Promoted ${oldest.email} to superadmin.`);
    }
  } catch (error) {
    console.error("Error creating initial admin:", error instanceof Error ? error.message : error);
  }
};
