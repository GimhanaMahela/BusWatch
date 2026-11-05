import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { telegramSubscriptions } from "../db/schema.js";

/** Follows a report from a Telegram chat. Returns false when the chat already followed it. */
export const saveTelegramSubscription = async (reportId: string, chatId: string) => {
  const inserted = await db
    .insert(telegramSubscriptions)
    .values({ reportId, chatId })
    .onConflictDoNothing()
    .returning({ id: telegramSubscriptions.id });
  return inserted.length > 0;
};

export const listTelegramChats = async (reportId: string) =>
  (
    await db
      .select({ chatId: telegramSubscriptions.chatId })
      .from(telegramSubscriptions)
      .where(eq(telegramSubscriptions.reportId, reportId))
  ).map((row) => row.chatId);

/** "/stop", or the passenger blocked the bot: forget the chat for every report. */
export const deleteTelegramChat = async (chatId: string) => {
  await db.delete(telegramSubscriptions).where(eq(telegramSubscriptions.chatId, chatId));
};

export const isTelegramFollowing = async (reportId: string, chatId: string) =>
  (await db.$count(
    telegramSubscriptions,
    and(eq(telegramSubscriptions.reportId, reportId), eq(telegramSubscriptions.chatId, chatId)),
  )) > 0;
