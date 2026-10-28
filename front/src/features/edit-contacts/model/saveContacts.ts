import { type Contacts, updateContacts } from "@/entities/contacts";
import { getCsrfToken } from "@/shared/api/csrf";

/** Saves all contacts and returns the values stored by the server. */
export async function saveContacts(contacts: Contacts): Promise<Contacts> {
  const csrfToken = await getCsrfToken();

  return updateContacts({ contacts, csrfToken });
}
