import type { ContactsWithPhoto } from "@/entities/contacts";
import { toPhotoFormValues } from "@/shared/lib/photoForm";

import type { ContactsFormValues } from "./contactsFormSchema";

export function toContactsFormValues({ contacts, photo }: ContactsWithPhoto): ContactsFormValues {
  return { ...contacts, ...toPhotoFormValues(photo) };
}
