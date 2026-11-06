import { z } from "zod";
import { ADMIN_ROLES } from "../config/constants.js";
import { busNumberList } from "./operator.validator.js";

export const loginSchema = z.object({
  email: z
    .string({ error: "Invalid Credentials" })
    .trim()
    .toLowerCase()
    .min(1, "Invalid Credentials"),
  password: z.string({ error: "Invalid Credentials" }).min(1, "Invalid Credentials"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerAdminSchema = z
  .object({
    email: z.email({ error: "A valid email is required" }).toLowerCase(),
    password: z
      .string({ error: "Password must be at least 8 characters" })
      .min(8, "Password must be at least 8 characters"),
    role: z.enum(ADMIN_ROLES, { error: "Invalid role" }).default("admin"),
    // Operators (bus owners): the name passengers see, and the buses they run
    organisation: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((value) => value || undefined),
    busNumbers: busNumberList.default([]),
  })
  .refine((data) => data.role !== "operator" || data.organisation, {
    error: "Enter the operator's company or owner name.",
    path: ["organisation"],
  });

export type RegisterAdminInput = z.infer<typeof registerAdminSchema>;
