import type { ContactPhoto, ContactsWithPhoto } from "@/entities/contacts";

import { type ContactsFormValues, savedPhoto } from "./contactsFormSchema";

type PhotoFormValues = Pick<ContactsFormValues, "photo" | "photoAlt">;

function toPhotoFormValues(photo: ContactPhoto | null): PhotoFormValues {
  return {
    photo: photo ? savedPhoto : null,
    photoAlt: photo?.alt ?? "",
  };
}

export function toContactsFormValues({ contacts, photo }: ContactsWithPhoto): ContactsFormValues {
  return { ...contacts, ...toPhotoFormValues(photo) };
}

/** The photo fields once their change is saved: a picked file becomes the saved photo. */
export function toSavedPhotoValues({ photo, photoAlt }: ContactsFormValues): PhotoFormValues {
  // A deleted photo takes its description with it.
  return photo === null ? { photo: null, photoAlt: "" } : { photo: savedPhoto, photoAlt };
}
