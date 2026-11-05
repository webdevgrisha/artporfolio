import { z } from "zod";

// Mirrors the server rule in backend/src/modules/gallery-intro/schema.ts.
export const maxIntroLength = 1_000;

/** An empty text is not shown on the site. */
export const galleryIntroFormSchema = z.object({
  text: z
    .string()
    .trim()
    .max(maxIntroLength, `Не длиннее ${String(maxIntroLength)} символов`),
});

export type GalleryIntroFormValues = z.infer<typeof galleryIntroFormSchema>;
