import { http } from "@/shared/api/http";

import { type Contacts, contactsResponseSchema } from "../model/contacts";

interface GetContactsParams {
  signal?: AbortSignal;
}

export async function getContacts({ signal }: GetContactsParams = {}): Promise<Contacts> {
  const response = await http.get({
    path: "/contacts",
    schema: contactsResponseSchema,
    signal,
  });

  return response.contacts;
}
