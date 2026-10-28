import type { FieldNamesMarkedBoolean } from "react-hook-form";

import type { ContactsWithPhoto } from "@/entities/contacts";

import { contactFields } from "./contactFields";
import type { ContactsChanges } from "./contactsChanges";
import type { ContactsFormValues } from "./contactsFormSchema";

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

  // The photo is compared by value: react-hook-form does not track changes inside a File.
  if (values.photo instanceof File) {
    changes.photo = { alt: values.photoAlt, file: values.photo, type: "upload" };
  } else if (values.photo === null) {
    if (saved.photo) changes.photo = { type: "delete" };
  } else if (dirtyFields.photoAlt) {
    changes.photo = { alt: values.photoAlt, type: "updateAlt" };
  }

  return changes;
}
