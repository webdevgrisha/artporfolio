import { z } from "zod";

import { http } from "@/shared/api/http";
import { photoSchema } from "@/shared/api/photo";

import { contactLinksSchema } from "../model/contactLinks";

const contactsSchema = z.object({
  links: contactLinksSchema,
  /** `null` until a photo is uploaded. */
  photo: photoSchema.nullable(),
});

export type Contacts = z.infer<typeof contactsSchema>;

interface GetContactsParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

export async function getContacts({ signal }: GetContactsParams): Promise<Contacts> {
  return http.get({
    path: "/contacts",
    schema: contactsSchema,
    signal,
  });
}
