import { http } from "@/shared/api/http";

import { type Contacts, contactsResponseSchema } from "../model/contacts";

interface UpdateContactsParams {
  contacts: Contacts;
  csrfToken: string;
}

/** Replaces all contacts and returns the values saved by the server (trimmed). */
export async function updateContacts({
  contacts,
  csrfToken,
}: UpdateContactsParams): Promise<Contacts> {
  const response = await http.put({
    path: "/contacts",
    body: contacts,
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: contactsResponseSchema,
  });

  return response.contacts;
}
