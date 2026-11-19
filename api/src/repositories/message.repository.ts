import { and, eq, isNull } from "drizzle-orm";
import type { MessageSender } from "../config/constants.js";
import { db } from "../db/client.js";
import { reportMessages, type MessageRow } from "../db/schema.js";

export const addMessage = async (
  reportId: string,
  sender: MessageSender,
  body: string,
  author?: string,
): Promise<MessageRow> => {
  const [message] = await db
    .insert(reportMessages)
    .values({ reportId, sender, body, author })
    .returning();
  if (!message) throw new Error("Message insert returned no row");
  return message;
};

/**
 * Marks the other side's messages as read: an admin opening a report reads the passenger's
 * messages, the passenger opening their tracking page reads the team's.
 */
export const markMessagesRead = async (reportId: string, reader: MessageSender) => {
  const from: MessageSender = reader === "admin" ? "passenger" : "admin";
  await db
    .update(reportMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(reportMessages.reportId, reportId),
        eq(reportMessages.sender, from),
        isNull(reportMessages.readAt),
      ),
    );
};
