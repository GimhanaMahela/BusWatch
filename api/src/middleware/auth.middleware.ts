import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { AdminRole } from "../config/constants.js";
import { env } from "../config/env.js";
import { PASSENGER_SESSION_DAYS } from "../config/constants.js";
import type { PassengerContact } from "../repositories/passenger.repository.js";
import type { AuthenticatedAdmin } from "../types/express.js";

interface TokenPayload {
  admin?: AuthenticatedAdmin;
}

// Passenger sessions use the same secret but their own audience and header, and carry no admin
// claim, so a passenger token can never open the admin console (and vice versa).
const PASSENGER_AUDIENCE = "buswatch-passenger";

export const signPassengerToken = (contact: PassengerContact) =>
  jwt.sign({ passenger: contact }, env.JWT_SECRET, {
    audience: PASSENGER_AUDIENCE,
    expiresIn: `${PASSENGER_SESSION_DAYS}d`,
  });

/** Requires a valid admin JWT in the x-auth-token header. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    res.status(401).json({ msg: "No token, authorization denied" });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (typeof decoded.admin?.id !== "string") throw new Error("Not an admin token");
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

/** Requires a "My reports" session (x-passenger-token header, from a one-time code). */
export const requirePassenger: RequestHandler = (req, res, next) => {
  const token = req.header("x-passenger-token");
  if (!token) {
    res.status(401).json({ msg: "Please sign in again." });
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { audience: PASSENGER_AUDIENCE }) as {
      passenger?: PassengerContact;
    };
    const contact = decoded.passenger;
    if (!contact || typeof contact.destination !== "string") throw new Error("No contact");
    req.passenger = contact;
    next();
  } catch {
    res.status(401).json({ msg: "Please sign in again." });
  }
};
