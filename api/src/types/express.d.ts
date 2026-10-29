import type { AdminRole } from "../config/constants.js";

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
    }
  }
}
