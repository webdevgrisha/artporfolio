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

/** An image file in Cloud Storage; its download URL is built from the path and token. */
const storedImageSchema = z.object({
  path: z.string(),
  token: z.string(),
  width: z.number().int().positive(),
});

/** The photo as stored in Firestore: one image per width in every format. */
export const storedPhotoSchema = z.object({
  alt: altSchema,
  fileName: z.string().max(maxFileNameLength),
  fileSize: z.number().int().positive(),
  height: z.number().int().positive(),
  sources: z.object({
    avif: z.array(storedImageSchema),
    webp: z.array(storedImageSchema),
  }),
  version: z.string(),
  width: z.number().int().positive(),
});

export type PhotoAltBody = z.infer<typeof photoAltBodySchema>;
export type StoredImage = z.infer<typeof storedImageSchema>;
export type StoredPhoto = z.infer<typeof storedPhotoSchema>;

/** An image as the API returns it, ready for a srcset. */
export interface ImageSource {
  url: string;
  width: number;
}

/** The photo as the API returns it, with download URLs in place of the stored paths. */
export interface Photo extends Omit<StoredPhoto, "sources"> {
  sources: { avif: ImageSource[]; webp: ImageSource[] };
}
