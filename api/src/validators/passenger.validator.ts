import { z } from "zod";
import { LANGUAGES, MAX_MESSAGE_LENGTH, PASSENGER_CODE } from "../config/constants.js";
import type { PassengerContact } from "../repositories/passenger.repository.js";
import { normalisePhone } from "../utils/phone.js";

const emailSchema = z.email();

/** An email address or mobile number, in the form reports store it. */
export const contactSchema = z
  .string({ error: "Enter your email address or mobile number." })
  .trim()
  .min(1, "Enter your email address or mobile number.")
  .max(254)
  .transform((value, ctx): PassengerContact => {
    if (value.includes("@")) {
      const email = value.toLowerCase();
      if (emailSchema.safeParse(email).success) return { channel: "email", destination: email };
      ctx.addIssue({ code: "custom", message: "Enter a valid email address." });
      return z.NEVER;
    }
    const phone = normalisePhone(value);
    if (phone) return { channel: "phone", destination: phone };
    ctx.addIssue({ code: "custom", message: "Enter a mobile number like 077 123 4567." });
    return z.NEVER;
  });

export const requestCodeSchema = z.object({
  contact: contactSchema,
  language: z.enum(LANGUAGES).catch("en").default("en"),
});
export type RequestCodeInput = z.infer<typeof requestCodeSchema>;

export const verifyCodeSchema = z.object({
  contact: contactSchema,
  code: z
    .string({ error: "Enter the code we sent you." })
    .trim()
    .regex(new RegExp(`^\\d{${PASSENGER_CODE.digits}}$`), "Enter the code we sent you."),
});
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

const messageBody = z
  .string({ error: "Write a message first." })
  .trim()
  .min(1, "Write a message first.")
  .max(MAX_MESSAGE_LENGTH, `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);

/** A passenger's reply on the tracking page */
export const passengerMessageSchema = z.object({ body: messageBody });
export type PassengerMessageInput = z.infer<typeof passengerMessageSchema>;

/** An admin's message to the passenger */
export const adminMessageSchema = z.object({
  body: messageBody,
  notifyPassenger: z.boolean().default(true),
});
export type AdminMessageInput = z.infer<typeof adminMessageSchema>;

/** A browser PushSubscription (as returned by subscription.toJSON()) */
export const pushSubscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/, error: "Invalid push subscription." }).max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});
export type PushSubscriptionBody = z.infer<typeof pushSubscriptionSchema>;

export const pushUnsubscribeSchema = z.object({ endpoint: z.string().min(1).max(2048) });
