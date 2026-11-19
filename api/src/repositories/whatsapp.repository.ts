import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { WHATSAPP } from "../config/constants.js";
import { db } from "../db/client.js";
import {
  whatsappChats,
  whatsappInbound,
  whatsappSubscriptions,
  type WhatsAppMedia,
} from "../db/schema.js";

export type WhatsAppChat = typeof whatsappChats.$inferSelect;
export type WhatsAppChatUpdate = Partial<Omit<typeof whatsappChats.$inferInsert, "phone">>;

const HOUR_MS = 60 * 60 * 1000;

// ------------------------------------------------------------------ Incoming message IDs

/**
 * Records an incoming message ID. Returns false when it was already handled (Meta re-sends webhook
 * calls it thinks failed). IDs older than a week are cleared out on the way.
 */
export const markInboundHandled = async (messageId: string) => {
  const inserted = await db
    .insert(whatsappInbound)
    .values({ messageId })
    .onConflictDoNothing()
    .returning({ messageId: whatsappInbound.messageId });
  if (inserted.length > 0 && Math.random() < 0.02) {
    await db
      .delete(whatsappInbound)
      .where(lt(whatsappInbound.receivedAt, new Date(Date.now() - 7 * 24 * HOUR_MS)));
  }
  return inserted.length > 0;
};

// ------------------------------------------------------------------ Conversations

/**
 * The chat for a number, created on first contact. A chat that has been quiet for a day starts
 * afresh: its history, draft and media are forgotten.
 */
export const openWhatsAppChat = async (phone: string, now = new Date()): Promise<WhatsAppChat> => {
  const [created] = await db
    .insert(whatsappChats)
    .values({ phone })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [chat] = await db.select().from(whatsappChats).where(eq(whatsappChats.phone, phone));
  if (!chat) throw new Error("WhatsApp chat disappeared");
  if (now.getTime() - chat.lastInboundAt.getTime() > WHATSAPP.chatIdleHours * HOUR_MS) {
    return resetWhatsAppChat(phone);
  }
  return chat;
};

/** Forgets the conversation and the report being written (the number's language is kept). */
export const resetWhatsAppChat = async (phone: string): Promise<WhatsAppChat> => {
  const [chat] = await db
    .update(whatsappChats)
    .set({
      history: [],
      draft: null,
      media: [],
      latitude: null,
      longitude: null,
      awaitingConfirmation: false,
      updatedAt: new Date(),
    })
    .where(eq(whatsappChats.phone, phone))
    .returning();
  if (!chat) throw new Error("WhatsApp chat disappeared");
  return chat;
};

export const updateWhatsAppChat = async (phone: string, values: WhatsAppChatUpdate) => {
  await db
    .update(whatsappChats)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(whatsappChats.phone, phone));
};

/**
 * Attaches a photo or video to the report being written, in one statement so photos sent together
 * (each arrives as its own webhook call) can't overwrite each other. Returns the chat's media after
 * the change, or null when that kind is already at its limit.
 */
export const appendWhatsAppMedia = async (phone: string, item: WhatsAppMedia, max: number) => {
  const [row] = await db
    .update(whatsappChats)
    .set({
      media: sql`${whatsappChats.media} || ${JSON.stringify([item])}::jsonb`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(whatsappChats.phone, phone),
        sql`(SELECT count(*) FROM jsonb_array_elements(${whatsappChats.media}) AS m WHERE m->>'kind' = ${item.kind}) < ${max}`,
      ),
    )
    .returning({ media: whatsappChats.media });
  return row?.media ?? null;
};

/**
 * Takes the report the passenger was asked to confirm, so that two taps on Send can't file it
 * twice: only one caller gets the chat back.
 */
export const claimWhatsAppDraft = async (phone: string): Promise<WhatsAppChat | null> => {
  const [chat] = await db
    .update(whatsappChats)
    .set({ awaitingConfirmation: false, updatedAt: new Date() })
    .where(and(eq(whatsappChats.phone, phone), eq(whatsappChats.awaitingConfirmation, true)))
    .returning();
  return chat ?? null;
};

/**
 * Notes an incoming message: updates "last wrote at" (for WhatsApp's 24-hour window) and counts it
 * against the hourly limit. Returns false when the number has sent too many messages this hour.
 */
export const recordInbound = async (phone: string, now = new Date()) => {
  const windowStart = new Date(now.getTime() - HOUR_MS);
  const [row] = await db
    .update(whatsappChats)
    .set({
      lastInboundAt: now,
      windowStartedAt: sql`CASE WHEN ${whatsappChats.windowStartedAt} < ${windowStart} THEN ${now} ELSE ${whatsappChats.windowStartedAt} END`,
      windowCount: sql`CASE WHEN ${whatsappChats.windowStartedAt} < ${windowStart} THEN 1 ELSE ${whatsappChats.windowCount} + 1 END`,
    })
    .where(eq(whatsappChats.phone, phone))
    .returning({ windowCount: whatsappChats.windowCount });
  return (row?.windowCount ?? 0) <= WHATSAPP.maxMessagesPerHour;
};

/** When each number last wrote to the bot (numbers that never did are left out). */
export const lastInboundTimes = async (phones: string[]) => {
  if (phones.length === 0) return new Map<string, Date>();
  const rows = await db
    .select({ phone: whatsappChats.phone, lastInboundAt: whatsappChats.lastInboundAt })
    .from(whatsappChats)
    .where(inArray(whatsappChats.phone, phones));
  return new Map(rows.map((row) => [row.phone, row.lastInboundAt]));
};

// ------------------------------------------------------------------ Following reports

/** Follows a report from a WhatsApp number. Returns false when it already followed it. */
export const saveWhatsAppSubscription = async (reportId: string, phone: string) => {
  const inserted = await db
    .insert(whatsappSubscriptions)
    .values({ reportId, phone })
    .onConflictDoNothing()
    .returning({ id: whatsappSubscriptions.id });
  return inserted.length > 0;
};

export const listWhatsAppFollowers = async (reportId: string) =>
  (
    await db
      .select({ phone: whatsappSubscriptions.phone })
      .from(whatsappSubscriptions)
      .where(eq(whatsappSubscriptions.reportId, reportId))
  ).map((row) => row.phone);

export const isWhatsAppFollowing = async (reportId: string, phone: string) =>
  (await db.$count(
    whatsappSubscriptions,
    and(eq(whatsappSubscriptions.reportId, reportId), eq(whatsappSubscriptions.phone, phone)),
  )) > 0;

/** "Stop": the number follows nothing any more and its conversation is forgotten. */
export const forgetWhatsAppNumber = async (phone: string) => {
  await db.delete(whatsappSubscriptions).where(eq(whatsappSubscriptions.phone, phone));
  await db
    .update(whatsappChats)
    .set({
      history: [],
      draft: null,
      media: [],
      latitude: null,
      longitude: null,
      awaitingConfirmation: false,
      updatedAt: new Date(),
    })
    .where(eq(whatsappChats.phone, phone));
};
