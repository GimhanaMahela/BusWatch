const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const { createInitialAdmin } = require("./controllers/authController");

const app = express();

// Connect Database
connectDB();

// Create initial admin if none exists (this runs once on function cold start)
createInitialAdmin();

// Enable CORS for frontend communication
// For separate deployments, it's safer to allow all origins here,
// or specify your frontend's Vercel deployment URL (e.g., 'https://your-frontend.vercel.app')
// as the origin once it's deployed.
app.use(cors());

// Init Middleware to parse JSON body
app.use(express.json({ extended: false }));

// Define Routes
// These routes will be prefixed with the path you defined in your backend vercel.json routes
// For example, if your vercel.json routes all requests to server.js,
// then /api/reports will be accessible directly.
app.use("/api/reports", require("./routes/reports"));
app.use("/api/auth", require("./routes/auth"));

// Health check endpoint (optional but recommended for serverless functions)
app.get("/health", (req, res) => {
  res.status(200).send("Backend is healthy!");
});

// IMPORTANT: Do NOT include static file serving or catch-all routes for the frontend
// when deploying backend and frontend separately on Vercel.
// The frontend project handles its own static files.
// The following block is removed:
/*
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}
*/

// Vercel Serverless Functions listen on an internal port managed by Vercel.
// You don't need to explicitly call app.listen() if you're exporting the app.
// However, if your setup relies on it for middleware initialization,
// keeping it might be necessary if your server.js isn't just a pure export.
// For Vercel, the important part is that the 'app' instance is created and ready.
// If your server.js does not explicitly export the `app` instance, and relies on `app.listen`,
// Vercel handles the listening part internally for serverless functions.
// This line might not be strictly necessary for serverless functions but won't harm.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app; // Export the app for Vercel's serverless function to use
