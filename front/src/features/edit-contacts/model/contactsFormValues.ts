import type { ContactPhoto, ContactsWithPhoto } from "@/entities/contacts";

import { type ContactsFormValues, savedPhoto } from "./contactsFormSchema";

type PhotoFormValues = Pick<ContactsFormValues, "photo" | "photoAlt">;

export function toPhotoFormValues(photo: ContactPhoto | null): PhotoFormValues {
  return {
    photo: photo ? savedPhoto : null,
    photoAlt: photo?.alt ?? "",
  };
}

export function toContactsFormValues({ contacts, photo }: ContactsWithPhoto): ContactsFormValues {
  return { ...contacts, ...toPhotoFormValues(photo) };
}
