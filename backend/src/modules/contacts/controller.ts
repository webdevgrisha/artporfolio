import type { RequestHandler } from "express";

import { getContactPhoto } from "#modules/contacts/photo/service";
import type { Contacts, ContactsResponse, SavedContactsResponse } from "#modules/contacts/schema";
import { getContacts, saveContacts } from "#modules/contacts/service";

export const readContacts: RequestHandler<object, ContactsResponse> = async (
  _request,
  response,
) => {
  const [contacts, photo] = await Promise.all([getContacts(), getContactPhoto()]);

  response.status(200).json({ contacts, photo });
};

export const updateContacts: RequestHandler<object, SavedContactsResponse, Contacts> = async (
  request,
  response,
) => {
  await saveContacts(request.body);

  response.status(200).json({ contacts: request.body });
};
