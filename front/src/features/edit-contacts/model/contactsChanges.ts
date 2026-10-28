import { z } from "zod";

import type { Contacts } from "@/entities/contacts";

import { contactLinksSchema, photoAltSchema } from "./contactsFormSchema";

export type PhotoChange =
  | { alt: string; file: File; type: "upload" }
  | { alt: string; type: "updateAlt" }
  | { type: "delete" };

/** What a save sends to the server: only the parts that were changed. */
export interface ContactsChanges {
  contacts?: Contacts;
  photo?: PhotoChange;
}

// The changes travel from the form to the route action as FormData, the only body that can
// carry a file. Each link is a field named after it.
const linkNames = contactLinksSchema.keyof().options;
const photoFieldNames = {
  alt: "photoAlt",
  file: "photoFile",
  type: "photoType",
} as const;

export function contactsChangesToFormData({ contacts, photo }: ContactsChanges): FormData {
  const formData = new FormData();

  if (contacts) {
    for (const name of linkNames) formData.set(name, contacts[name]);
  }

  if (photo) {
    formData.set(photoFieldNames.type, photo.type);
    if (photo.type !== "delete") formData.set(photoFieldNames.alt, photo.alt);
    if (photo.type === "upload") formData.set(photoFieldNames.file, photo.file);
  }

  return formData;
}

const photoChangeSchema = z.discriminatedUnion("type", [
  z.object({ alt: photoAltSchema, file: z.instanceof(File), type: z.literal("upload") }),
  z.object({ alt: photoAltSchema, type: z.literal("updateAlt") }),
  z.object({ type: z.literal("delete") }),
]);

const contactsChangesSchema = z.object({
  contacts: contactLinksSchema.optional(),
  photo: photoChangeSchema.optional(),
});

/** Reads and validates the changes sent by `contactsChangesToFormData`. */
export function parseContactsChanges(formData: FormData) {
  const hasContacts = linkNames.some((name) => formData.has(name));
  const hasPhoto = formData.has(photoFieldNames.type);

  // A missing field is `null` and fails the schema.
  return contactsChangesSchema.safeParse({
    contacts: hasContacts
      ? Object.fromEntries(linkNames.map((name) => [name, formData.get(name)]))
      : undefined,
    photo: hasPhoto
      ? {
          alt: formData.get(photoFieldNames.alt),
          file: formData.get(photoFieldNames.file),
          type: formData.get(photoFieldNames.type),
        }
      : undefined,
  });
}
