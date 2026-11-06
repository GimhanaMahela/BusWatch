import { z } from "zod";
import { REPORT_CATEGORIES } from "../config/constants.js";
import type { StoryTranslations } from "../db/schema.js";

const text = (field: string, max: number) =>
  z
    .string({ error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`)
    .max(max, `${field} must be ${max} characters or fewer`);

const translation = z
  .object({ title: z.string().trim().max(160), body: z.string().trim().max(2000) })
  .optional()
  // A half-filled translation is dropped rather than shown with English mixed in
  .transform((t) => (t?.title && t.body ? t : undefined));

const storyFields = {
  title: text("Title", 160),
  body: text("Story", 2000),
  translations: z
    .object({ si: translation, ta: translation })
    .transform(
      (t) => Object.fromEntries(Object.entries(t).filter(([, v]) => v)) as StoryTranslations,
    ),
  category: z.enum(REPORT_CATEGORIES).nullable().optional(),
  routeNumber: z
    .string()
    .trim()
    .max(60)
    .nullable()
    .optional()
    .transform((r) => r || null),
  reportId: z.uuid().nullable().optional(),
  published: z.boolean(),
};

export const createStorySchema = z.object({
  ...storyFields,
  translations: storyFields.translations.prefault({}),
  published: storyFields.published.default(false),
});
export type CreateStoryInput = z.infer<typeof createStorySchema>;

// No defaults here: an edit that leaves a field out must not reset it (e.g. unpublish the story)
export const updateStorySchema = z.object(storyFields).partial();
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;

export const visibilitySchema = z.object({
  hiddenFromPublic: z.boolean({ error: "hiddenFromPublic must be true or false" }),
});
export type VisibilityInput = z.infer<typeof visibilitySchema>;
