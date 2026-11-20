/** "operator" is a bus owner or company using the operator portal, not the admin console. */
export type AdminRole = "superadmin" | "admin" | "operator";

export interface Admin {
  id: string;
  email: string;
  role: AdminRole;
  /** Operators: the company or owner name passengers see */
  organisation?: string | null;
  /** Operators: their buses, normalised (e.g. "NB1234") */
  fleet?: string[];
  createdAt?: string;
}

export const isOperator = (admin: Pick<Admin, "role"> | null | undefined) =>
  admin?.role === "operator";
