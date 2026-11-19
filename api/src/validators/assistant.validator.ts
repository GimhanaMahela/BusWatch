import { z } from "zod";
import { ASSISTANT, LANGUAGES } from "../config/constants.js";

/** POST /api/assistant/chat: the conversation so far, ending with the passenger's new message */
export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z
          .string()
          .trim()
          .min(1)
          .max(ASSISTANT.maxMessageLength, "Please keep each message shorter."),
      }),
    )
    .min(1)
    .max(ASSISTANT.maxMessages, "This chat is long. Please start a new one.")
    .refine((messages) => messages.at(-1)?.role === "user", "The last message must be yours."),
  language: z.enum(LANGUAGES).default("en"),
});

export type ChatInput = z.infer<typeof chatSchema>;

/** POST /api/assistant/emergency: what the passenger has typed so far */
export const emergencyCheckSchema = z.object({
  text: z.string().trim().min(1).max(ASSISTANT.maxMessageLength),
  language: z.enum(LANGUAGES).default("en"),
});

export type EmergencyCheckInput = z.infer<typeof emergencyCheckSchema>;
