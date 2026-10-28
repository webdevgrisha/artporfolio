import { z } from "zod";

const altSchema = z.string().trim().min(1).max(250);

/** The longest file name most file systems allow. */
const maxFileNameLength = 255;

/** Text fields sent with the photo file, and the body of an alt text update. */
export const photoAltBodySchema = z
  .object({
    alt: altSchema,
  })
  .strict();

const imageSourceSchema = z.object({
  url: z.url(),
  width: z.number().int().positive(),
});

/** A stored photo: one image per width in every format, ready for a <picture> srcset. */
export const photoSchema = z.object({
  alt: altSchema,
  fileName: z.string().max(maxFileNameLength),
  fileSize: z.number().int().positive(),
  height: z.number().int().positive(),
  sources: z.object({
    avif: z.array(imageSourceSchema),
    webp: z.array(imageSourceSchema),
  }),
  version: z.string(),
  width: z.number().int().positive(),
});

export type PhotoAltBody = z.infer<typeof photoAltBodySchema>;
export type ImageSource = z.infer<typeof imageSourceSchema>;
export type Photo = z.infer<typeof photoSchema>;
