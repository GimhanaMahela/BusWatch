const Admin = require("../models/admin.model");

// Runs on startup: creates the first superadmin from env vars, and makes sure
// databases created before roles existed still have one superadmin.
const createInitialAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL;
      const password = process.env.ADMIN_PASSWORD;
      if (!email || !password) {
        console.warn(
          "No admins exist and ADMIN_EMAIL / ADMIN_PASSWORD are not set. Skipping initial admin creation."
        );
        return;
      }
      if (password.length < 8) {
        console.warn("ADMIN_PASSWORD must be at least 8 characters. Skipping initial admin creation.");
        return;
      }
      await new Admin({ email, password, role: "superadmin" }).save();
      console.log("Initial superadmin created successfully!");
      return;
    }

    const superadminExists = await Admin.exists({ role: "superadmin" });
    if (!superadminExists) {
      const oldest = await Admin.findOne().sort({ _id: 1 });
      oldest.role = "superadmin";
      await oldest.save();
      console.log(`Promoted ${oldest.email} to superadmin.`);
    }
  } catch (error) {
    console.error("Error creating initial admin:", error.message);
  }
};

module.exports = { createInitialAdmin };
