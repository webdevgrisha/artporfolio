import { z } from "zod";

import type { Photo } from "@/shared/api/photo";

import {
  type ImageFieldValue,
  imageFieldValueSchema,
  savedImage,
  toImageFieldValue,
} from "./imageFieldValue";

// Mirrors the server rule in backend/src/shared/images/photo.ts.
const maxAltLength = 250;

/** The description of a photo: what is on it, for screen readers and search engines. */
export const photoAltSchema = z
  .string()
  .trim()
  .min(1, "Опишите, что на фото")
  .max(maxAltLength, `Не длиннее ${String(maxAltLength)} символов`);

/**
 * The fields of a photo with its description, to spread into a form schema together with
 * `refinePhotoAlt`. `PhotoFields` shows them.
 */
export const photoFieldsShape = {
  photo: imageFieldValueSchema,
  photoAlt: z.string().trim(),
};

export interface PhotoFormValues {
  photo: ImageFieldValue;
  photoAlt: string;
}

/** Checks the description only while there is a photo: without one it is hidden and not saved. */
export function refinePhotoAlt<TValues extends PhotoFormValues>(
  { photo, photoAlt }: TValues,
  context: z.RefinementCtx<TValues>,
): void {
  if (photo === null) return;

  for (const issue of photoAltSchema.safeParse(photoAlt).error?.issues ?? []) {
    context.addIssue({ code: "custom", message: issue.message, path: ["photoAlt"] });
  }
}

export function toPhotoFormValues(photo: Photo | null): PhotoFormValues {
  return { photo: toImageFieldValue(photo), photoAlt: photo?.alt ?? "" };
}

/** The photo fields once their change is saved: a picked file becomes the saved photo. */
export function toSavedPhotoValues({ photo, photoAlt }: PhotoFormValues): PhotoFormValues {
  // A deleted photo takes its description with it.
  return photo === null ? { photo: null, photoAlt: "" } : { photo: savedImage, photoAlt };
}

/** What a save does with the photo. */
export type PhotoChange =
  | { alt: string; file: File; type: "upload" }
  | { alt: string; type: "updateAlt" }
  | { type: "delete" };

/**
 * The change of the submitted photo fields, or `undefined` when there is none. Only what the user
 * changed in the form counts: the photo is deleted only when they removed it here, never because
 * the server has a photo the form did not show, such as one uploaded in another tab.
 */
export function getPhotoChange(
  { photo, photoAlt }: PhotoFormValues,
  { isAltDirty, isPhotoDirty }: { isAltDirty: boolean; isPhotoDirty: boolean },
): PhotoChange | undefined {
  if (photo instanceof File) return { alt: photoAlt, file: photo, type: "upload" };
  if (photo === null) return isPhotoDirty ? { type: "delete" } : undefined;

  return isAltDirty ? { alt: photoAlt, type: "updateAlt" } : undefined;
}
