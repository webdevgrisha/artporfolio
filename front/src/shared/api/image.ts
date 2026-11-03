import { z } from "zod";

import type { FileRules } from "@/shared/lib/getFileRejection";

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

/**
 * The rules of a photo upload, other than a hero; mirrors `minPhotoSize` and the other rules in
 * backend/src/shared/images/processing.ts.
 */
export const imageUploadRules = {
  accept: ["image/jpeg", "image/png", ".jpg", ".jpeg", ".png"],
  acceptLabel: "JPEG или PNG",
  maxFileSize: 15 * 1024 * 1024,
  minImageSize: { pixels: 1_280, side: "longer" },
} as const satisfies FileRules;

/** A hero fills the width of the screen; mirrors `minHeroSize` on the server. */
export const heroUploadRules = {
  ...imageUploadRules,
  minImageSize: { pixels: 1_920, side: "width" },
} as const satisfies FileRules;
