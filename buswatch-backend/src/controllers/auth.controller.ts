import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AdminModel, type AdminDocument } from "../models/admin.model.js";
import type { LoginInput, RegisterAdminInput } from "../validators/auth.validator.js";

const signToken = (admin: AdminDocument): string =>
  jwt.sign({ admin: { id: admin.id, email: admin.email, role: admin.role } }, env.JWT_SECRET, {
    expiresIn: "8h",
  });

// @desc    Create a new admin account (invite)
// @route   POST /api/auth/register
// @access  Private (superadmin only)
export const registerAdmin = async (
  req: Request<object, object, RegisterAdminInput>,
  res: Response,
) => {
  const { email, password, role } = req.body;

  if (await AdminModel.exists({ email })) {
    res.status(400).json({ msg: "Admin already exists" });
    return;
  }

  const admin = await AdminModel.create({ email, password, role });
  res.status(201).json({
    admin: { _id: admin.id, email: admin.email, role: admin.role, createdAt: admin.createdAt },
  });
};

// @desc    Authenticate admin & get token
// @route   POST /api/auth/login
// @access  Public
export const loginAdmin = async (req: Request<object, object, LoginInput>, res: Response) => {
  const { email, password } = req.body;

  const admin = await AdminModel.findOne({ email });
  if (!admin || !(await admin.matchPassword(password))) {
    res.status(400).json({ msg: "Invalid Credentials" });
    return;
  }

  res.json({ token: signToken(admin) });
};

// @desc    Get logged in admin details
// @route   GET /api/auth
// @access  Private
export const getAdmin = async (req: Request, res: Response) => {
  const admin = await AdminModel.findById(req.admin?.id).select("-password");
  if (!admin) {
    res.status(401).json({ msg: "Admin no longer exists" });
    return;
  }
  res.json(admin);
};

// @desc    List admin accounts
// @route   GET /api/auth/admins
// @access  Private (superadmin only)
export const listAdmins = async (_req: Request, res: Response) => {
  const admins = await AdminModel.find().select("-password").sort({ createdAt: 1 });
  res.json(admins);
};
