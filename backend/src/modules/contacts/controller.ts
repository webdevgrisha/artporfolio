import type { RequestHandler } from "express";

import type { ContactsResponse } from "#modules/contacts/schema";
import { getContacts } from "#modules/contacts/service";

export const readContacts: RequestHandler<object, ContactsResponse> = async (
  _request,
  response,
) => {
  response.status(200).json(await getContacts());
};
