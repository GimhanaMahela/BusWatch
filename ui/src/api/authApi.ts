import type { Admin, AdminRole } from "@/types/admin";
import apiClient, { call } from "@/api/apiClient";

export const loginAdmin = (email: string, password: string) =>
  call<{ token: string }>(apiClient.post("/auth/login", { email, password }));

export const getAdminProfile = () => call<Admin>(apiClient.get("/auth"));

// Superadmin only
export const listAdmins = () => call<Admin[]>(apiClient.get("/auth/admins"));

export interface NewAccount {
  email: string;
  password: string;
  role: AdminRole;
  /** Operators only */
  organisation?: string;
  busNumbers?: string[];
}

export const createAdmin = (account: NewAccount) =>
  call<{ admin: Admin }>(apiClient.post("/auth/register", account));

/** Superadmin: change an operator's buses and name */
export const updateOperatorFleet = (id: string, busNumbers: string[], organisation?: string) =>
  call<Admin>(apiClient.put(`/auth/admins/${id}/fleet`, { busNumbers, organisation }));
