import { z } from "zod";

import { photoSchema } from "@/shared/api/photo";

/** The earliest year a work can be dated (backend/src/modules/gallery-works/schema.ts). */
export const minWorkYear = 1900;

/** The largest side of a work, in either unit. */
export const maxWorkSide = 10_000;

/** The units the artist measures a work in; the site converts them for the visitor. */
export const workSizeUnits = ["cm", "in"] as const;

export type WorkSizeUnit = (typeof workSizeUnits)[number];

/** The size of a work as the artist measured it. */
export const workSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
  unit: z.enum(workSizeUnits),
});

export type WorkSize = z.infer<typeof workSizeSchema>;

/** A work of the gallery. An empty description is not shown on the site. */
export const galleryWorkSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  size: workSizeSchema,
  /** The year the work was finished. */
  year: z.number(),
  photo: photoSchema,
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
