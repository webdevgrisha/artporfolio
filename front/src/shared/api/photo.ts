import { z } from "zod";

import { imageSchema } from "./image";

/**
 * A single photo with its description, such as «Моё фото»
 * (backend/src/shared/images/photo.ts → PhotoSlot).
 */
export const photoSchema = imageSchema.extend({
  alt: z.string(),
});

export type Photo = z.infer<typeof photoSchema>;

/** A photo as a change sends it: a new file by its upload, or the saved file when it is left out. */
export interface PhotoBody {
  alt: string;
  uploadId?: string;
}

/**
 * A photo of an ordered list, such as the process photos or the photos of a project
 * (backend/src/shared/images/photo-list.ts). The id stays the same when the file is replaced.
 */
export const listPhotoSchema = photoSchema.extend({
  id: z.string(),
});

export type ListPhoto = z.infer<typeof listPhotoSchema>;

/**
 * One photo of a new list: a saved one by its id, a new file by its upload (see `uploadImage`),
 * or both to replace the file of a saved photo. A saved photo left out of the list is deleted.
 */
export type ListPhotoItem =
  | { alt: string; id: string; uploadId?: string }
  | { alt: string; uploadId: string };
