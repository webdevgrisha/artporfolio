import { z } from "zod";

import { imageSchema } from "@/lib/api/image";

/**
 * The pages of the site as `GET /api/pages` returns them, by their id in the admin («Страницы»):
 * the photo that opens each, its hero, or null until the artist uploads one.
 */
export const pagesSchema = z.object({
  pages: z.record(z.string(), z.object({ hero: imageSchema.nullable() })),
});
