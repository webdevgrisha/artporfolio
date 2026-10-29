import type { LoaderFunctionArgs } from "react-router";

import { getContacts } from "@/entities/contacts";

export async function contactsLoader({ request }: LoaderFunctionArgs) {
  return getContacts({ signal: request.signal });
}
