import { z } from "zod";

import { listPhotoSchema, photoSchema } from "@/shared/api/photo";

/** The earliest year a work can be dated (backend/src/modules/gallery-works/schema.ts). */
export const minWorkYear = 1900;

/** The most process photos one work may have. */
export const maxWorkProcessPhotos = 20;

/** The largest side of a work in centimetres. */
export const maxWorkSide = 10_000;

/** The size of a work in centimetres; the site converts it for visitors who read inches. */
export const workSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export type WorkSize = z.infer<typeof workSizeSchema>;

/** A work of the gallery. */
export const galleryWorkSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  size: workSizeSchema,
  /** The year the work was finished. */
  year: z.number(),
  photo: photoSchema,
  /** How the work was made, in the order the site shows them. */
  processPhotos: z.array(listPhotoSchema),
  /** When the work was created, ISO 8601. */
  createdAt: z.iso.datetime(),
  /** When the admin last saved the work, ISO 8601. */
  updatedAt: z.iso.datetime(),
});

export type GalleryWork = z.infer<typeof galleryWorkSchema>;

/** The shape of every API response that returns one work. */
export const galleryWorkResponseSchema = z.object({
  work: galleryWorkSchema,
});

export const galleryWorksResponseSchema = z.object({
  /** In the order the site shows them: the latest year first. */
  works: z.array(galleryWorkSchema),
});
