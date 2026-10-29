import type { About, AboutPhoto, ProcessPhoto } from "@/entities/about";
import { savedImage, toImageFieldValue } from "@/shared/lib/imageFieldValue";

import type { AboutFormValues, ProcessPhotoRow } from "./aboutFormSchema";

type PhotoFormValues = Pick<AboutFormValues, "photo" | "photoAlt">;

function toPhotoFormValues(photo: AboutPhoto | null): PhotoFormValues {
  return {
    photo: toImageFieldValue(photo),
    photoAlt: photo?.alt ?? "",
  };
}

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

/** The photo fields once their change is saved: a picked file becomes the saved photo. */
export function toSavedPhotoValues({ photo, photoAlt }: AboutFormValues): PhotoFormValues {
  // A deleted photo takes its description with it.
  return photo === null ? { photo: null, photoAlt: "" } : { photo: savedImage, photoAlt };
}
