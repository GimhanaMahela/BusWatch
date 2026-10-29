const Admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");
const { ADMIN_ROLES } = require("../config/constants");
require("dotenv").config();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (admin) =>
  jwt.sign(
    { admin: { id: admin.id, email: admin.email, role: admin.role } },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

// @desc    Create a new admin account (invite)
// @route   POST /api/auth/register
// @access  Private (superadmin only)
exports.registerAdmin = async (req, res) => {
  const { email, password, role = "admin" } = req.body;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ msg: "A valid email is required" });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ msg: "Password must be at least 8 characters" });
  }
  if (!ADMIN_ROLES.includes(role)) {
    return res.status(400).json({ msg: "Invalid role" });
  }

  try {
    let admin = await Admin.findOne({ email: email.toLowerCase() });
    if (admin) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    admin = new Admin({ email, password, role });
    await admin.save();

    res.status(201).json({
      admin: { _id: admin.id, email: admin.email, role: admin.role, createdAt: admin.createdAt },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Authenticate admin & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Invalid Credentials" });
  }

  try {
    const admin = await Admin.findOne({ email: String(email).toLowerCase() });
    if (!admin) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    res.json({ token: signToken(admin) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    Get logged in admin details
// @route   GET /api/auth
// @access  Private
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) {
      return res.status(401).json({ msg: "Admin no longer exists" });
    }
    res.json(admin);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// @desc    List admin accounts
// @route   GET /api/auth/admins
// @access  Private (superadmin only)
exports.listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: 1 });
    res.json(admins);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
