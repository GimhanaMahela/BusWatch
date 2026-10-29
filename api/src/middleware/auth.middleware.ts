import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { AdminRole } from "../config/constants.js";
import { env } from "../config/env.js";
import type { AuthenticatedAdmin } from "../types/express.js";

interface TokenPayload {
  admin: AuthenticatedAdmin;
}

/** Requires a valid admin JWT in the x-auth-token header. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    res.status(401).json({ msg: "No token, authorization denied" });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.admin = decoded.admin;
    next();
  } catch {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

/** Use after requireAuth to restrict a route to specific roles. */
export const requireRole =
  (...roles: AdminRole[]): RequestHandler =>
  (req, res, next) => {
    if (!req.admin?.role || !roles.includes(req.admin.role)) {
      res.status(403).json({ msg: "You do not have permission to do this" });
      return;
    }
    next();
  };
