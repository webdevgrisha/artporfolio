import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { Contacts, ContactsWithPhoto } from "@/entities/contacts";
import { getPhotoChange, type PhotoChange } from "@/shared/lib/photoForm";

import { contactFields } from "./contactFields";
import type { ContactsFormValues } from "./contactsFormSchema";

/** What a save sends to the server: only the parts that were changed. */
export interface ContactsChanges {
  contacts?: Contacts;
  photo?: PhotoChange;
}

/** Picks the parts of the submitted values that differ from the saved ones. */
export function getContactsChanges(
  values: ContactsFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<ContactsFormValues>>>,
  saved: ContactsWithPhoto,
): ContactsChanges {
  const changes: ContactsChanges = {};

  // The server replaces all links at once.
  if (contactFields.some((field) => dirtyFields[field.name])) {
    const { email, instagram, linkedin, youtube } = values;
    changes.contacts = { email, instagram, linkedin, youtube };
  }

  const photo = getPhotoChange(values, {
    hasServerPhoto: saved.photo !== null,
    isAltDirty: Boolean(dirtyFields.photoAlt),
  });
  if (photo) changes.photo = photo;

  return changes;
}
