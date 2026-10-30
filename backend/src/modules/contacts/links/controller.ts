import type { RequestHandler } from "express";

import type { ContactLinks, ContactLinksResponse } from "#modules/contacts/links/schema";
import { getContactLinks, saveContactLinks } from "#modules/contacts/links/service";

export const readLinks: RequestHandler<object, ContactLinksResponse> = async (
  _request,
  response,
) => {
  response.status(200).json({ links: await getContactLinks() });
};

export const replaceLinks: RequestHandler<object, ContactLinksResponse, ContactLinks> = async (
  request,
  response,
) => {
  await saveContactLinks(request.body);

  response.status(200).json({ links: request.body });
};
