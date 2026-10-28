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
// carry a file.
const fieldNames = {
  contacts: "contacts",
  photoAlt: "photoAlt",
  photoFile: "photoFile",
  photoType: "photoType",
} as const;

export function contactsChangesToFormData({ contacts, photo }: ContactsChanges): FormData {
  const formData = new FormData();

  if (contacts) {
    formData.set(fieldNames.contacts, JSON.stringify(contacts));
  }

  if (photo) {
    formData.set(fieldNames.photoType, photo.type);
    if (photo.type !== "delete") formData.set(fieldNames.photoAlt, photo.alt);
    if (photo.type === "upload") formData.set(fieldNames.photoFile, photo.file);
  }

  return formData;
}

const contactsJsonSchema = z
  .string()
  .transform((json, context) => {
    try {
      return JSON.parse(json) as unknown;
    } catch {
      context.addIssue({ code: "custom", message: "Invalid JSON" });
      return z.NEVER;
    }
  })
  .pipe(contactLinksSchema);

const photoChangeSchema = z.discriminatedUnion("type", [
  z.object({ alt: photoAltSchema, file: z.instanceof(File), type: z.literal("upload") }),
  z.object({ alt: photoAltSchema, type: z.literal("updateAlt") }),
  z.object({ type: z.literal("delete") }),
]);

/** Reads and validates the changes sent by `contactsChangesToFormData`. */
export function parseContactsChanges(formData: FormData) {
  const contacts = formData.get(fieldNames.contacts);
  const photoType = formData.get(fieldNames.photoType);

  return z
    .object({
      contacts: contactsJsonSchema.optional(),
      photo: photoChangeSchema.optional(),
    })
    .safeParse({
      contacts: contacts ?? undefined,
      photo:
        photoType === null
          ? undefined
          : {
              alt: formData.get(fieldNames.photoAlt) ?? undefined,
              file: formData.get(fieldNames.photoFile) ?? undefined,
              type: photoType,
            },
    });
}
