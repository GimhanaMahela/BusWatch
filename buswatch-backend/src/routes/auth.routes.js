const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

// @route   POST /api/auth/register
// @desc    Register admin (should be restricted post-initial setup)
// @access  Public (for initial setup)
router.post("/register", authController.registerAdmin);

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post("/login", authController.loginAdmin);

// @route   GET /api/auth
// @desc    Get logged in admin details
// @access  Private
router.get("/", auth, authController.getAdmin);

module.exports = router;
