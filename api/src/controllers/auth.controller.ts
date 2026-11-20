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
import {
  getAllFleets,
  getFleet,
  setFleet,
  setOrganisation,
} from "../repositories/operator.repository.js";
import type { LoginInput, RegisterAdminInput } from "../validators/auth.validator.js";
import type { UpdateFleetInput } from "../validators/operator.validator.js";

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
  const { busNumbers, ...account } = req.body;
  const admin = await createAdmin(account);
  const fleet = admin.role === "operator" ? await setFleet(admin.id, busNumbers) : [];
  res.status(201).json({ admin: { ...toPublicAdmin(admin), fleet } });
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
  const fleet = admin.role === "operator" ? await getFleet(admin.id) : undefined;
  res.json({ ...toPublicAdmin(admin), fleet });
};

// @desc    List admin accounts
// @route   GET /api/auth/admins
// @access  Private (superadmin only)
export const listAdmins = async (_req: Request, res: Response) => {
  const [accounts, fleets] = await Promise.all([listAllAdmins(), getAllFleets()]);
  res.json(
    accounts.map((admin) =>
      admin.role === "operator" ? { ...admin, fleet: fleets.get(admin.id) ?? [] } : admin,
    ),
  );
};

// @desc    Change an operator's buses and name
// @route   PUT /api/auth/admins/:id/fleet
// @access  Private (superadmin only)
export const updateFleet = async (
  req: Request<{ id: string }, object, UpdateFleetInput>,
  res: Response,
) => {
  const operator = await findAdminById(req.params.id);
  if (operator?.role !== "operator") {
    res.status(404).json({ msg: "Operator not found" });
    return;
  }
  if (req.body.organisation) await setOrganisation(operator.id, req.body.organisation);
  const fleet = await setFleet(operator.id, req.body.busNumbers);
  const updated = await findAdminById(operator.id);
  res.json({ ...toPublicAdmin(updated ?? operator), fleet });
};
