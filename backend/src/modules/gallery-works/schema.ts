import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { altSchema, photoSchema, storedPhotoSchema } from "#shared/images/photo";
import { uploadIdSchema } from "#shared/images/uploads";

/** The earliest year a work can be dated. */
export const minWorkYear = 1900;

/** The largest side, in either unit: well above any painting, low enough to catch a typo. */
export const maxWorkSide = 10_000;

/** The units the artist measures a work in; the site converts them for the visitor. */
export const workSizeUnits = ["cm", "in"] as const;

const workIdSchema = z.uuid();

/** The path parameters of a request about one work. */
export const workParamsSchema = z.object({
  id: workIdSchema,
});

/** A side of a work, with at most two decimals, such as 8.5 inches. */
const workSideSchema = z.number().positive().max(maxWorkSide).multipleOf(0.01);

/** The size of a work as the artist measured it. */
const workSizeSchema = z.strictObject({
  width: workSideSchema,
  height: workSideSchema,
  unit: z.enum(workSizeUnits),
});

/**
 * The photo of the work: a new file by its upload, or the saved file when `uploadId` is left out,
 * so the alt text can change alone.
 */
const workPhotoBodySchema = z.strictObject({
  alt: altSchema,
  uploadId: uploadIdSchema.optional(),
});

/**
 * A work as the client sends it, to create one or to replace a saved one. Every field is sent; an
 * empty description is not shown on the site.
 */
export const workBodySchema = z.strictObject({
  /** The name in the gallery, so it cannot be empty. */
  title: z.string().trim().min(1).max(100),
  /** Plain text: no HTML or Markdown. Paragraphs are separated by a blank line. */
  description: z.string().trim().max(2_000),
  size: workSizeSchema,
  /** A work is dated by the year it was finished, which cannot be in the future. */
  year: z
    .number()
    .int()
    .min(minWorkYear)
    .refine((year) => year <= new Date().getFullYear(), "The year cannot be in the future"),
  photo: workPhotoBodySchema,
});

/**
 * A work as stored in Firestore, in its own document of the `galleryWorks` collection. Only the
 * shape is checked: the rules above apply when a work is saved, so tightening a rule later never
 * makes a saved work unreadable.
 */
export const storedWorkSchema = z.object({
  title: z.string(),
  description: z.string(),
  size: z.object({ width: z.number(), height: z.number(), unit: z.string() }),
  year: z.number(),
  photo: storedPhotoSchema,
  /** Set by the server when the work is created. */
  createdAt: z.instanceof(Timestamp),
  /** Set by the server whenever the admin saves the work. */
  updatedAt: z.instanceof(Timestamp),
});

/** A work as the API returns it. */
export const workSchema = z.object({
  id: workIdSchema,
  title: z.string(),
  description: z.string(),
  size: z.object({ width: z.number(), height: z.number(), unit: z.string() }),
  year: z.number(),
  photo: photoSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const workResponseSchema = z.object({ work: workSchema });

export const worksResponseSchema = z.object({
  /** In the order the site shows them: the latest year first. */
  works: z.array(workSchema),
});

export type WorkParams = z.infer<typeof workParamsSchema>;
export type WorkBody = z.infer<typeof workBodySchema>;
export type StoredWork = z.infer<typeof storedWorkSchema>;
export type Work = z.infer<typeof workSchema>;
export type WorkResponse = z.infer<typeof workResponseSchema>;
export type WorksResponse = z.infer<typeof worksResponseSchema>;
