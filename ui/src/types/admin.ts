export type AdminRole = "superadmin" | "admin";

export interface Admin {
  id: string;
  email: string;
  role: AdminRole;
  createdAt?: string;
}
