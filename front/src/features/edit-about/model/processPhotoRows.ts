import type { ProcessPhoto } from "@/entities/about";

import type { ProcessPhotoRow } from "./processPhotosFormSchema";

/** The row of a process photo as stored on the server. */
export function toProcessPhotoRow(photo: ProcessPhoto): ProcessPhotoRow {
  return { alt: photo.alt, file: null, photoId: photo.id, status: "saved" };
}

/** The rows of process photos as stored on the server. */
export function toProcessPhotoRows(processPhotos: readonly ProcessPhoto[]): ProcessPhotoRow[] {
  return processPhotos.map(toProcessPhotoRow);
}
