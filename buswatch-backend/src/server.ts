// Entry point for Node, Docker and Vercel. The Express app itself lives in app.ts.
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createInitialAdmin } from "./services/admin-bootstrap.service.js";

const app = createApp();

// Connect Database, then make sure an initial superadmin exists
connectDB()
  .then(createInitialAdmin)
  .catch((error: unknown) => {
    console.error("Failed to connect to MongoDB:", error instanceof Error ? error.message : error);
    process.exit(1);
  });

// On Vercel the exported app is invoked as a serverless function; elsewhere we listen
if (!env.VERCEL) {
  app.listen(env.PORT, () => console.log(`Server started on port ${env.PORT}`));
}

export default app;
