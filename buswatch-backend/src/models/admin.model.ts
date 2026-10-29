import bcrypt from "bcryptjs";
import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import { ADMIN_ROLES, type AdminRole } from "../config/constants.js";

export interface Admin {
  email: string;
  password: string;
  role: AdminRole;
  createdAt: Date;
}

interface AdminMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export type AdminDocument = HydratedDocument<Admin, AdminMethods>;
type AdminModel = Model<Admin, object, AdminMethods>;

const AdminSchema = new Schema<Admin, AdminModel, AdminMethods>({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ADMIN_ROLES, default: "admin" },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
AdminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

AdminSchema.method("matchPassword", function (this: AdminDocument, enteredPassword: string) {
  return bcrypt.compare(enteredPassword, this.password);
});

export const AdminModel = model<Admin, AdminModel>("Admin", AdminSchema);
