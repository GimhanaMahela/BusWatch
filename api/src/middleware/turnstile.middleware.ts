import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const TURNSTILE_FIELD = "cf-turnstile-response";

interface SiteverifyResult {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Cloudflare Turnstile (CAPTCHA) check for public submissions, added before results go public so
 * scorecards can't be flooded by bots. Runs after multer so multipart fields are parsed.
 * Without TURNSTILE_SECRET_KEY (development, tests) it lets requests through.
 */
export const verifyTurnstile = async (req: Request, res: Response, next: NextFunction) => {
  if (!env.TURNSTILE_SECRET_KEY) {
    next();
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const token = body[TURNSTILE_FIELD];
  if (typeof token !== "string" || !token) {
    res.status(400).json({ msg: "Please complete the security check.", code: "captcha_required" });
    return;
  }

  let result: SiteverifyResult;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        ...(req.ip ? { remoteip: req.ip } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    result = (await response.json()) as SiteverifyResult;
  } catch (error) {
    // Cloudflare unreachable: fail closed, the passenger can retry (the report stays on their phone)
    console.error("Turnstile verification failed:", error instanceof Error ? error.message : error);
    res.status(503).json({ msg: "Could not verify the security check. Please try again." });
    return;
  }

  if (!result.success) {
    res.status(400).json({
      msg: "The security check failed. Please try again.",
      code: "captcha_failed",
    });
    return;
  }
  delete body[TURNSTILE_FIELD];
  next();
};
