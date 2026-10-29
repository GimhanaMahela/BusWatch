const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// Vercel / Docker sit behind a proxy; needed so rate limiting sees the real client IP
app.set("trust proxy", 1);

// CORS: set CORS_ORIGINS to a comma-separated list of frontend URLs in production.
// When it is not set, all origins are allowed (handy for local development).
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));

app.use(express.json({ limit: "100kb" }));

app.use("/api", apiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Backend is healthy!");
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
