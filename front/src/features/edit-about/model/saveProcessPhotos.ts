import { type ProcessPhoto, type ProcessPhotoItem, replaceProcessPhotos } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import { uploadImage } from "@/shared/api/upload";

import type { ProcessPhotoRow } from "./processPhotosFormSchema";

export interface SaveProcessPhotosParams {
  /** The ETag of the list the rows were made from. */
  etag: string;
  rows: readonly ProcessPhotoRow[];
}

async function toItem(row: ProcessPhotoRow): Promise<ProcessPhotoItem> {
  if (row.status === "new") return { alt: row.alt, uploadId: await uploadImage(row.file) };
  if (row.file) return { alt: row.alt, id: row.photo.id, uploadId: await uploadImage(row.file) };

  return { alt: row.alt, id: row.photo.id };
}

/**
 * Uploads the picked files, one at a time because the server encodes every photo, then replaces
 * the list in one request, which the server saves all or nothing. Until that request, nothing on
 * the site changes. Returns the saved list.
 */
export async function saveProcessPhotos({
  etag,
  rows,
}: SaveProcessPhotosParams): Promise<Tagged<ProcessPhoto[]>> {
  const processPhotos: ProcessPhotoItem[] = [];

  for (const row of rows) {
    processPhotos.push(await toItem(row));
  }

  return replaceProcessPhotos({ etag, processPhotos });
}
