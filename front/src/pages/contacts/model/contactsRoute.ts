import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { getContacts } from "@/entities/contacts";
import {
  contactsFormSchema,
  getSaveContactsErrorMessage,
  saveContacts,
} from "@/features/edit-contacts";

export async function contactsLoader({ request }: LoaderFunctionArgs) {
  return getContacts({ signal: request.signal });
}

export async function contactsAction({ request }: ActionFunctionArgs) {
  const values = contactsFormSchema.safeParse(await request.json());

  if (!values.success) {
    return { error: getSaveContactsErrorMessage(values.error), ok: false } as const;
  }

  try {
    return { contacts: await saveContacts(values.data), ok: true } as const;
  } catch (error) {
    return { error: getSaveContactsErrorMessage(error), ok: false } as const;
  }
}
