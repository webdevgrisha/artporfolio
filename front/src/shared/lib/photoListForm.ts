import { z } from "zod";

import type { ListPhoto, ListPhotoItem } from "@/shared/api/photo";
import { uploadImage } from "@/shared/api/upload";

import { photoAltSchema } from "./photoForm";

const photoListRowSchema = z.discriminatedUnion("status", [
  z.object({
    alt: photoAltSchema,
    /** A picked file that replaces the saved one; `null` keeps the saved file. */
    file: z.instanceof(File).nullable(),
    /** The photo on the server the row was made from, as the user saw it. */
    photo: z.custom<ListPhoto>(),
    status: z.literal("saved"),
  }),
  z.object({
    alt: photoAltSchema,
    file: z.instanceof(File),
    status: z.literal("new"),
  }),
]);

/** A row of an ordered photo list: a photo on the server, or a new one to upload. */
export type PhotoListRow = z.infer<typeof photoListRowSchema>;

/** The rows of a list of at most `maxPhotos` photos, in the order the site shows them. */
export function photoListRowsSchema(maxPhotos: number) {
  return z.array(photoListRowSchema).max(maxPhotos, `Не больше ${String(maxPhotos)} фото`);
}

/** The form values that `PhotoListField` edits. */
export interface PhotoListFormValues {
  photos: PhotoListRow[];
}

/** The row of a photo as stored on the server. */
export function toPhotoListRow(photo: ListPhoto): PhotoListRow {
  return { alt: photo.alt, file: null, photo, status: "saved" };
}

/** The rows of photos as stored on the server. */
export function toPhotoListRows(photos: readonly ListPhoto[]): PhotoListRow[] {
  return photos.map(toPhotoListRow);
}

async function toPhotoListItem(row: PhotoListRow): Promise<ListPhotoItem> {
  if (row.status === "new") return { alt: row.alt, uploadId: await uploadImage(row.file) };
  if (row.file) return { alt: row.alt, id: row.photo.id, uploadId: await uploadImage(row.file) };

  return { alt: row.alt, id: row.photo.id };
}

/**
 * The new list for the server: uploads the picked files one at a time, because the server encodes
 * every photo. A repeated save does not send the files that an earlier one uploaded. Rejects with
 * `UploadError`.
 */
export async function toPhotoListItems(rows: readonly PhotoListRow[]): Promise<ListPhotoItem[]> {
  const items: ListPhotoItem[] = [];

  for (const row of rows) {
    items.push(await toPhotoListItem(row));
  }

  return items;
}
