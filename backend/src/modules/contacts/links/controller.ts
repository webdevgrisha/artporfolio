import type { RequestHandler } from "express";

import type { ContactLinks } from "#modules/contacts/links/schema";
import { getContactLinks, replaceContactLinks } from "#modules/contacts/links/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readLinks: RequestHandler<object, ContactLinks> = async (_request, response) => {
  const { data, etag } = await getContactLinks();

  response.status(200).set("ETag", etag).json(data);
};

export const replaceLinks: RequestHandler<object, ContactLinks, ContactLinks> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceContactLinks(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};
