import type { About, AboutPhoto } from "@/entities/about";

import { type AboutFormValues, savedPhoto } from "./aboutFormSchema";

type PhotoFormValues = Pick<AboutFormValues, "photo" | "photoAlt">;

function toPhotoFormValues(photo: AboutPhoto | null): PhotoFormValues {
  return {
    photo: photo ? savedPhoto : null,
    photoAlt: photo?.alt ?? "",
  };
}

export function toAboutFormValues({ photo, text }: About): AboutFormValues {
  // The texts are empty until they are first saved.
  const { about = "", biography = "", creation = "" } = text ?? {};

  return { about, biography, creation, ...toPhotoFormValues(photo) };
}

/** The photo fields once their change is saved: a picked file becomes the saved photo. */
export function toSavedPhotoValues({ photo, photoAlt }: AboutFormValues): PhotoFormValues {
  // A deleted photo takes its description with it.
  return photo === null ? { photo: null, photoAlt: "" } : { photo: savedPhoto, photoAlt };
}
