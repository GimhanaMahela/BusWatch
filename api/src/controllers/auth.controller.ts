import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AdminRow } from "../db/schema.js";
import {
  createAdmin,
  findAdminByEmail,
  findAdminById,
  listAdmins as listAllAdmins,
  toPublicAdmin,
  verifyPassword,
} from "../repositories/admin.repository.js";
import type { LoginInput, RegisterAdminInput } from "../validators/auth.validator.js";

const signToken = (admin: AdminRow): string =>
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
  if (await findAdminByEmail(req.body.email)) {
    res.status(400).json({ msg: "Admin already exists" });
    return;
  }
  const admin = await createAdmin(req.body);
  res.status(201).json({ admin: toPublicAdmin(admin) });
};

// @desc    Authenticate admin & get token
// @route   POST /api/auth/login
// @access  Public
export const loginAdmin = async (req: Request<object, object, LoginInput>, res: Response) => {
  const admin = await findAdminByEmail(req.body.email);
  if (!admin || !(await verifyPassword(admin, req.body.password))) {
    res.status(400).json({ msg: "Invalid Credentials" });
    return;
  }
  res.json({ token: signToken(admin) });
};

// @desc    Get logged in admin details
// @route   GET /api/auth
// @access  Private
export const getAdmin = async (req: Request, res: Response) => {
  const admin = req.admin ? await findAdminById(req.admin.id) : undefined;
  if (!admin) {
    res.status(401).json({ msg: "Admin no longer exists" });
    return;
  }
  res.json(toPublicAdmin(admin));
};

// @desc    List admin accounts
// @route   GET /api/auth/admins
// @access  Private (superadmin only)
export const listAdmins = async (_req: Request, res: Response) => {
  res.json(await listAllAdmins());
};
