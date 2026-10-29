const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/auth.middleware");
const { loginLimiter } = require("../middleware/rate-limit.middleware");

// @route   POST /api/auth/register
// @desc    Create a new admin account
// @access  Private (superadmin)
router.post("/register", auth, requireRole("superadmin"), authController.registerAdmin);

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post("/login", loginLimiter, authController.loginAdmin);

// @route   GET /api/auth/admins
// @desc    List admin accounts
// @access  Private (superadmin)
router.get("/admins", auth, requireRole("superadmin"), authController.listAdmins);

// @route   GET /api/auth
// @desc    Get logged in admin details
// @access  Private
router.get("/", auth, authController.getAdmin);

module.exports = router;
