import { z } from "zod";

/** How the works use one item of a gallery list, such as a material or a section. */
const workUsageSchema = z.object({
  /** The works that name the item, or for a section, the section or any of its subsections. */
  count: z.number(),
  /** Of those, the works that name nothing else of the list: they cannot be saved until fixed. */
  onlyCount: z.number(),
});

export type WorkUsage = z.infer<typeof workUsageSchema>;

/** The usage of each item of a list, by its id. */
export type WorkUsages = Readonly<Record<string, WorkUsage>>;

/** How the works use each item of each list a work names, counted by the server. */
export const galleryWorkUsageSchema = z.object({
  sections: z.record(z.string(), workUsageSchema),
  materials: z.record(z.string(), workUsageSchema),
  colors: z.record(z.string(), workUsageSchema),
  palettes: z.record(z.string(), workUsageSchema),
});

export type GalleryWorkUsage = z.infer<typeof galleryWorkUsageSchema>;
