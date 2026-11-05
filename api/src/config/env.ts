import { z } from "zod";

// Empty values in .env files ("KEY=") mean "not set"
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  VERCEL: optional(z.string()),

  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }).min(1, "DATABASE_URL is required"),
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
  // Cloudflare Turnstile CAPTCHA on public submissions; skipped when unset (development, tests)
  TURNSTILE_SECRET_KEY: optional(z.string()),

  // SMS / WhatsApp updates and sign-in codes. "none" (the default) sends nothing.
  SMS_PROVIDER: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(["none", "notifylk", "twilio"]).default("none"),
  ),
  NOTIFYLK_USER_ID: optional(z.string()),
  NOTIFYLK_API_KEY: optional(z.string()),
  NOTIFYLK_SENDER_ID: optional(z.string()),
  TWILIO_ACCOUNT_SID: optional(z.string()),
  TWILIO_AUTH_TOKEN: optional(z.string()),
  // A Twilio number (+1...) for SMS, or "whatsapp:+1..." to send WhatsApp messages instead
  TWILIO_FROM: optional(z.string()),

  // Browser push notifications (Web Push). Generate a pair with `npx web-push generate-vapid-keys`.
  VAPID_PUBLIC_KEY: optional(z.string()),
  VAPID_PRIVATE_KEY: optional(z.string()),
  // Contact for push services, e.g. mailto:info@buswatch.lk
  VAPID_SUBJECT: optional(z.string()),

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
