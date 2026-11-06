import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { impactStories, reports, type NewStoryRow, type StoryRow } from "../db/schema.js";

/** All stories for the admin list, newest first, with the receipt ID of the case they describe. */
export const listStories = () =>
  db
    .select({
      story: impactStories,
      receiptId: reports.receiptId,
    })
    .from(impactStories)
    .leftJoin(reports, eq(impactStories.reportId, reports.id))
    .orderBy(desc(impactStories.updatedAt))
    .then((rows) => rows.map(({ story, receiptId }) => ({ ...story, receiptId })));

export const findStoryById = async (id: string) =>
  (await db.select().from(impactStories).where(eq(impactStories.id, id)))[0] ?? null;

export const createStory = async (values: NewStoryRow): Promise<StoryRow> => {
  const [story] = await db
    .insert(impactStories)
    .values({ ...values, publishedAt: values.published ? new Date() : null })
    .returning();
  if (!story) throw new Error("Story insert returned no row");
  return story;
};

/** Updates a story; publishing stamps publishedAt (kept on later edits), unpublishing clears it. */
export const updateStory = async (id: string, values: Partial<NewStoryRow>) => {
  const current = await findStoryById(id);
  if (!current) return null;
  const published = values.published ?? current.published;
  const [story] = await db
    .update(impactStories)
    .set({
      ...values,
      publishedAt: published ? (current.publishedAt ?? new Date()) : null,
      updatedAt: new Date(),
    })
    .where(eq(impactStories.id, id))
    .returning();
  return story ?? null;
};

export const deleteStory = async (id: string) => {
  const [deleted] = await db.delete(impactStories).where(eq(impactStories.id, id)).returning();
  return deleted ?? null;
};
