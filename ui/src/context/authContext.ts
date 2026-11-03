import { createContext } from "react";
import type { Admin } from "@/types/admin";

export interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  /** True until the stored session has been checked (and while logging in). */
  loading: boolean;
  admin: Admin | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
