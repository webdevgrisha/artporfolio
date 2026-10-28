import type { ContactsWithPhoto } from "@/entities/contacts";

import { type ContactsFormValues, savedPhoto } from "./contactsFormSchema";

export function toContactsFormValues({ contacts, photo }: ContactsWithPhoto): ContactsFormValues {
  return {
    ...contacts,
    photo: photo ? savedPhoto : null,
    photoAlt: photo?.alt ?? "",
  };
}
