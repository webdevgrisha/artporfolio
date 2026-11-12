import type { RequestHandler } from "express";

import type { ContactsResponse } from "#modules/contacts/schema";
import { getContacts } from "#modules/contacts/service";
import type { LanguageQuery } from "#shared/i18n/language-query";

export const readContacts: RequestHandler<
  object,
  ContactsResponse,
  unknown,
  LanguageQuery
> = async (request, response) => {
  response.status(200).json(await getContacts(request.query.lang));
};
