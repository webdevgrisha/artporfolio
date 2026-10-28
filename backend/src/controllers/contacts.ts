import type { RequestHandler } from "express";

import type { Contacts } from "#schemas/contacts";
import { getContacts, saveContacts } from "#services/contacts";

export const readContacts: RequestHandler = async (_request, response) => {
  const contacts = await getContacts();

  response.status(200).json({ contacts });
};

export const updateContacts: RequestHandler<object, unknown, Contacts> = async (
  request,
  response,
) => {
  await saveContacts(request.body);

  response.status(200).json({ contacts: request.body });
};
