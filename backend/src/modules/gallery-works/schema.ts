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

/** The most sections and subsections one work may be in. */
export const maxWorkSections = 30;

/** The most materials one work may be made of. */
export const maxWorkMaterials = 10;

/** The most colors one work may have. */
export const maxWorkColors = 10;

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

/** The size of a work in centimetres, the only unit stored; the API adds the size in inches. */
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

/** Ids of the items of a gallery list a work refers to, at least one, each named once. */
function referenceIdsSchema(max: number) {
  return z
    .array(z.uuid())
    .min(1)
    .max(max)
    .refine((ids) => new Set(ids).size === ids.length, "Each id must appear once");
}

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
    /**
     * The sections and subsections the work is shown in, by id; at least one, so a visitor finds
     * it. A subsection is named alone: the site shows its works in its section too.
     */
    sectionIds: referenceIdsSchema(maxWorkSections),
    /** What the work is made of, by the ids of the gallery materials; at least one. */
    materialIds: referenceIdsSchema(maxWorkMaterials),
    /**
     * The colors a visitor finds the work by, by the ids of the gallery colors; at least one. A
     * black-and-white work has both black and white.
     */
    colorIds: referenceIdsSchema(maxWorkColors),
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
  /** May name a section deleted since; the API leaves such ids out. */
  sectionIds: z.array(z.string()),
  /** May name a material deleted since; the API leaves such ids out. */
  materialIds: z.array(z.string()),
  /** May name a color deleted since; the API leaves such ids out. */
  colorIds: z.array(z.string()),
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
  /** The same size in inches, computed from the centimetres for the site; not stored. */
  sizeInches: z.object({ width: z.number(), height: z.number() }),
  year: z.number(),
  /** 1 for January. */
  month: z.number(),
  photo: photoSchema,
  /** In the order the site shows them. */
  processPhotos: z.array(listPhotoSchema),
  /** The sections and subsections the work is shown in; a deleted one is left out. */
  sectionIds: z.array(z.uuid()),
  /** The materials the work is made of; a deleted one is left out. */
  materialIds: z.array(z.uuid()),
  /** The colors of the work; a deleted one is left out. */
  colorIds: z.array(z.uuid()),
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
