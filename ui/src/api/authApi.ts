import type { Admin, AdminRole } from "../types/admin";
import apiClient, { call } from "./apiClient";

export const loginAdmin = (email: string, password: string) =>
  call<{ token: string }>(apiClient.post("/auth/login", { email, password }));

export const getAdminProfile = () => call<Admin>(apiClient.get("/auth"));

// Superadmin only
export const listAdmins = () => call<Admin[]>(apiClient.get("/auth/admins"));

export const createAdmin = (email: string, password: string, role: AdminRole = "admin") =>
  call<{ admin: Admin }>(apiClient.post("/auth/register", { email, password, role }));
