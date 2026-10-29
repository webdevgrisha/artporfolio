import { z } from "zod";

import { http } from "@/shared/api/http";
import { photoSchema } from "@/shared/api/photo";

import { contactsSchema } from "../model/contacts";

const contactsWithPhotoSchema = z.object({
  contacts: contactsSchema,
  /** `null` until a photo is uploaded. */
  photo: photoSchema.nullable(),
});

export type ContactsWithPhoto = z.infer<typeof contactsWithPhotoSchema>;

interface GetContactsParams {
  /** Cancels the request, e.g. when the route loader is no longer needed. */
  signal: AbortSignal;
}

export async function getContacts({ signal }: GetContactsParams): Promise<ContactsWithPhoto> {
  return http.get({
    path: "/contacts",
    schema: contactsWithPhotoSchema,
    signal,
  });
}
