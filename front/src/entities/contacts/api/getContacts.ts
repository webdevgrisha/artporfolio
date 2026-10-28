import { z } from "zod";

import { http } from "@/shared/api/http";

import { contactPhotoSchema } from "../model/contactPhoto";
import { contactsSchema } from "../model/contacts";

const contactsWithPhotoSchema = z.object({
  contacts: contactsSchema,
  /** `null` until a photo is uploaded. */
  photo: contactPhotoSchema.nullable(),
});

export type ContactsWithPhoto = z.infer<typeof contactsWithPhotoSchema>;

interface GetContactsParams {
  signal?: AbortSignal;
}

export async function getContacts({ signal }: GetContactsParams = {}): Promise<ContactsWithPhoto> {
  return http.get({
    path: "/contacts",
    schema: contactsWithPhotoSchema,
    signal,
  });
}
