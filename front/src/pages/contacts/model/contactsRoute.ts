import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { getContacts } from "@/entities/contacts";
import {
  getSaveContactsErrorMessage,
  parseContactsChanges,
  type SaveContactsResult,
  saveContacts,
} from "@/features/edit-contacts";

export async function contactsLoader({ request }: LoaderFunctionArgs) {
  return getContacts({ signal: request.signal });
}

export async function contactsAction({ request }: ActionFunctionArgs): Promise<SaveContactsResult> {
  const changes = parseContactsChanges(await request.formData());

  if (!changes.success) {
    return { error: getSaveContactsErrorMessage(changes.error) };
  }

  try {
    return await saveContacts(changes.data);
  } catch (error) {
    return { error: getSaveContactsErrorMessage(error) };
  }
}
