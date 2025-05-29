const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const cors = require("cors");
const { createInitialAdmin } = require("./controllers/authController"); // For initial admin creation

const app = express();

// Connect Database
connectDB();

// Create initial admin if none exists
createInitialAdmin();

// Init Middleware
app.use(express.json({ extended: false })); // Allows us to get data in req.body
app.use(cors()); // Enable CORS for frontend communication

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token'] // Allow these headers
}));

// Define Routes
app.use("/api/reports", require("./routes/reports"));
app.use("/api/auth", require("./routes/auth"));

// Serve static assets in production (for React build)
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build")); // Assuming your React build is in 'client/build'

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
