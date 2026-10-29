import { z } from "zod";

// Empty values in .env files ("KEY=") mean "not set"
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  VERCEL: optional(z.string()),

  MONGO_URI: z.string({ error: "MONGO_URI is required" }).min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string({ error: "JWT_SECRET is required" }).min(1, "JWT_SECRET is required"),

  ADMIN_EMAIL: optional(z.email()),
  ADMIN_PASSWORD: optional(z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters")),

  CORS_ORIGINS: optional(z.string()),
  FRONTEND_URL: optional(z.url()),

  CLOUDINARY_CLOUD_NAME: optional(z.string()),
  CLOUDINARY_API_KEY: optional(z.string()),
  CLOUDINARY_API_SECRET: optional(z.string()),

  EMAIL_SERVICE_HOST: optional(z.string()),
  EMAIL_SERVICE_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_SERVICE_USER: optional(z.string()),
  EMAIL_SERVICE_PASS: optional(z.string()),
  EMAIL_ALLOW_SELF_SIGNED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${problems}`);
}

export const env: Env = parsed.data;

export const corsOrigins = (env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const frontendUrl = (env.FRONTEND_URL ?? "").replace(/\/$/, "");
