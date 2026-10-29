// Entry point for Node, Docker and Vercel. The Express app itself lives in src/app.js.
require("dotenv").config();
const connectDB = require("./src/config/db");
const { createInitialAdmin } = require("./src/services/admin-bootstrap.service");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Refusing to start without it.");
  process.exit(1);
}

const app = require("./src/app");

// Connect Database, then make sure an initial superadmin exists
connectDB().then(createInitialAdmin);

// On Vercel the exported app is invoked as a serverless function; elsewhere we listen
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;
