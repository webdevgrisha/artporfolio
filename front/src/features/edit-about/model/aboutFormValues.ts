import type { About, ProcessPhoto } from "@/entities/about";
import { toPhotoFormValues } from "@/shared/lib/photoForm";

import type { AboutFormValues, ProcessPhotoRow } from "./aboutFormSchema";

/** The row of a process photo as stored on the server. */
export function toProcessPhotoRow(photo: ProcessPhoto): ProcessPhotoRow {
  return { alt: photo.alt, file: null, photoId: photo.id, status: "saved" };
}

/** The rows of process photos as stored on the server. */
export function toProcessPhotoRows(processPhotos: readonly ProcessPhoto[]): ProcessPhotoRow[] {
  return processPhotos.map(toProcessPhotoRow);
}

export function toAboutFormValues({ photo, processPhotos, text }: About): AboutFormValues {
  // The texts are empty until they are first saved.
  const { about = "", biography = "", creation = "" } = text ?? {};

  return {
    about,
    biography,
    creation,
    ...toPhotoFormValues(photo),
    processPhotos: toProcessPhotoRows(processPhotos),
  };
}
