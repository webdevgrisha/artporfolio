import { z } from "zod";

/** One encoded file of an image, for a srcset. */
const imageSourceSchema = z.object({
  url: z.string(),
  width: z.number(),
});

/** An uploaded photo as the API returns it, resized to several widths (backend/src/shared/images/storage.ts → imageSchema). */
export const imageSchema = z.object({
  /** Name of the uploaded file. */
  fileName: z.string(),
  /** Size of the uploaded file, in bytes. */
  fileSize: z.number(),
  /** Size of the largest image. */
  height: z.number(),
  /** Ordered by width. The server makes every format in at least one width. */
  sources: z.object({
    avif: z.tuple([imageSourceSchema], imageSourceSchema),
    webp: z.tuple([imageSourceSchema], imageSourceSchema),
  }),
  version: z.string(),
  width: z.number(),
});

export type Image = z.infer<typeof imageSchema>;

/** Mirrors the rules of every photo upload in backend/src/shared/images/processing.ts. */
export const imageUploadRules = {
  accept: ["image/jpeg", "image/png", ".jpg", ".jpeg", ".png"],
  acceptLabel: "JPEG или PNG",
  maxFileSize: 15 * 1024 * 1024,
} as const;
