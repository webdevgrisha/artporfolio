import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { altSchema, photoSchema, storedPhotoSchema } from "#shared/images/photo";
import {
  listPhotoSchema,
  photoListBodySchema,
  storedListPhotoSchema,
} from "#shared/images/photo-list";
import { uploadIdSchema } from "#shared/images/uploads";

/** The earliest year a work can be dated. */
export const minWorkYear = 1900;

/** The most process photos one work may have; raise it when the artist needs more. */
export const maxWorkProcessPhotos = 20;

/** The largest side in centimetres: well above any painting, low enough to catch a typo. */
export const maxWorkSide = 10_000;

const workIdSchema = z.uuid();

/** The path parameters of a request about one work. */
export const workParamsSchema = z.object({
  id: workIdSchema,
});

/** A side of a work in centimetres, with at most two decimals, such as 29.7. */
const workSideSchema = z.number().positive().max(maxWorkSide).multipleOf(0.01);

/** The size of a work in centimetres; the site converts it for visitors who read inches. */
const workSizeSchema = z.strictObject({
  width: workSideSchema,
  height: workSideSchema,
});

/**
 * The photo of the work: a new file by its upload, or the saved file when `uploadId` is left out,
 * so the alt text can change alone.
 */
const workPhotoBodySchema = z.strictObject({
  alt: altSchema,
  uploadId: uploadIdSchema.optional(),
});

/** Whether the month of the year has not come yet, by the server clock. */
function isFutureMonth(year: number, month: number): boolean {
  const now = new Date();

  return year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
}

/** A work as the client sends it, to create one or to replace a saved one. Every field is sent. */
export const workBodySchema = z
  .strictObject({
    /** The name in the gallery, so it cannot be empty. */
    title: z.string().trim().min(1).max(100),
    /**
     * What the work is about, which the visitor reads beside it. Plain text: no HTML or Markdown.
     * Paragraphs are separated by a blank line.
     */
    description: z.string().trim().min(1).max(2_000),
    size: workSizeSchema,
    /** A work is dated by the month it was finished, which cannot be in the future. */
    year: z.number().int().min(minWorkYear),
    /** 1 for January. */
    month: z.number().int().min(1).max(12),
    photo: workPhotoBodySchema,
    /** How the work was made, in the order the site shows them; a saved photo left out is deleted. */
    processPhotos: photoListBodySchema(maxWorkProcessPhotos),
  })
  .refine(({ month, year }) => !isFutureMonth(year, month), {
    message: "The month cannot be in the future",
    path: ["month"],
  });

/**
 * A work as stored in Firestore, in its own document of the `galleryWorks` collection. Only the
 * shape is checked: the rules above apply when a work is saved, so tightening a rule later never
 * makes a saved work unreadable.
 */
export const storedWorkSchema = z.object({
  title: z.string(),
  description: z.string(),
  size: z.object({ width: z.number(), height: z.number() }),
  year: z.number(),
  month: z.number(),
  photo: storedPhotoSchema,
  processPhotos: z.array(storedListPhotoSchema),
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
  /** In centimetres. */
  size: z.object({ width: z.number(), height: z.number() }),
  year: z.number(),
  /** 1 for January. */
  month: z.number(),
  photo: photoSchema,
  /** In the order the site shows them. */
  processPhotos: z.array(listPhotoSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const workResponseSchema = z.object({ work: workSchema });

export const worksResponseSchema = z.object({
  /** In the order the site shows them: the latest first. */
  works: z.array(workSchema),
});

export type WorkParams = z.infer<typeof workParamsSchema>;
export type WorkBody = z.infer<typeof workBodySchema>;
export type StoredWork = z.infer<typeof storedWorkSchema>;
export type Work = z.infer<typeof workSchema>;
export type WorkResponse = z.infer<typeof workResponseSchema>;
export type WorksResponse = z.infer<typeof worksResponseSchema>;
