import type { AdminRole } from "../config/constants.js";
import type { PassengerContact } from "../repositories/passenger.repository.js";

export interface AuthenticatedAdmin {
  id: string;
  email?: string;
  role?: AdminRole;
}

declare global {
  namespace Express {
    interface Request {
      /** Set by the auth middleware on protected routes */
      admin?: AuthenticatedAdmin;
      /** Set by requirePassenger on "My reports" routes */
      passenger?: PassengerContact;
    }
  }
}
