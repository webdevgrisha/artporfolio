import { z } from "zod";

import { photoSchema } from "@/lib/api/image";

/** The texts of the About page; an empty one leaves its section out. */
const aboutTextSchema = z.object({
  /** The introduction under the portrait. */
  about: z.string(),
  /** The section «Biography». */
  biography: z.string(),
  /** The section «Artistic creation». */
  creation: z.string(),
});

/** The About page as `GET /api/about` returns it, in the language of the page. */
export const aboutSchema = z.object({
  text: aboutTextSchema,
  /** The portrait of the artist; null until one is uploaded. */
  photo: photoSchema.nullable(),
  /** The photos of the work in progress, in order; empty when there are none. */
  processPhotos: z.array(photoSchema),
});

export type About = z.infer<typeof aboutSchema>;
