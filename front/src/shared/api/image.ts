import { z } from "zod";

/** One encoded file of an image, for a srcset. */
const imageSourceSchema = z.object({
  url: z.string(),
  width: z.number(),
});

/** An uploaded photo as the API returns it, resized to several widths (backend/openapi/openapi.yaml → Image). */
export const imageSchema = z.object({
  /** Name of the uploaded file. */
  fileName: z.string(),
  /** Size of the uploaded file, in bytes. */
  fileSize: z.number(),
  /** Size of the largest image. */
  height: z.number(),
  /** Ordered by width. The server makes every format in at least one width. */
  sources: z.object({
    avif: z.array(imageSourceSchema).min(1),
    webp: z.array(imageSourceSchema).min(1),
  }),
  version: z.string(),
  width: z.number(),
});

export type Image = z.infer<typeof imageSchema>;

/** Mirrors the rules of every photo upload in backend/openapi/openapi.yaml → image upload `file`. */
export const imageUploadRules = {
  accept: ["image/jpeg", "image/png", ".jpg", ".jpeg", ".png"],
  acceptLabel: "JPEG или PNG",
  maxFileSize: 15 * 1024 * 1024,
} as const;
