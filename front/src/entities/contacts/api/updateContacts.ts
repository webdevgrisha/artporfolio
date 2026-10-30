import { http } from "@/shared/api/http";

import { type Contacts, contactsResponseSchema } from "../model/contacts";

interface UpdateContactsParams {
  contacts: Contacts;
}

/** Replaces all contacts and returns the values saved by the server (trimmed). */
export async function updateContacts({ contacts }: UpdateContactsParams): Promise<Contacts> {
  const response = await http.put({
    path: "/contacts",
    body: contacts,
    schema: contactsResponseSchema,
  });

  return response.contacts;
}
