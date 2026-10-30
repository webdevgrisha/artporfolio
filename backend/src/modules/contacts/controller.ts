import type { RequestHandler } from "express";

import type { Contacts, ContactsResponse, SavedContactsResponse } from "#modules/contacts/schema";
import { getContacts, saveContacts } from "#modules/contacts/service";

export const readContacts: RequestHandler<object, ContactsResponse> = async (
  _request,
  response,
) => {
  response.status(200).json(await getContacts());
};

export const updateContacts: RequestHandler<object, SavedContactsResponse, Contacts> = async (
  request,
  response,
) => {
  await saveContacts(request.body);

  response.status(200).json({ contacts: request.body });
};
