import type { About, ProcessPhoto } from "@/entities/about";
import { toPhotoFormValues } from "@/shared/lib/photoForm";

import type { AboutFormValues, ProcessPhotoRow } from "./aboutFormSchema";

/** The rows of process photos as stored on the server. */
export function toProcessPhotoRows(processPhotos: readonly ProcessPhoto[]): ProcessPhotoRow[] {
  return processPhotos.map((photo) => ({
    alt: photo.alt,
    file: null,
    photoId: photo.id,
    status: "saved",
  }));
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
