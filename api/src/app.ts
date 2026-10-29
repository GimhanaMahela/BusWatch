import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOrigins } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import apiRoutes from "./routes/index.js";

export const createApp = () => {
  const app = express();

  // Vercel / Docker sit behind a proxy; needed so rate limiting sees the real client IP
  app.set("trust proxy", 1);

  app.use(helmet());
  // With CORS_ORIGINS unset all origins are allowed (handy for local development)
  app.use(cors(corsOrigins.length ? { origin: corsOrigins } : undefined));
  app.use(express.json({ limit: "100kb" }));

  app.use("/api", apiRoutes);

  app.get("/health", (_req, res) => {
    res.status(200).send("Backend is healthy!");
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
