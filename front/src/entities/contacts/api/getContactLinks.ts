import { http, type Tagged } from "@/shared/api/http";

import { type ContactLinks, contactLinksSchema } from "../model/contactLinks";

/** The links with their ETag, which a replacement of the links sends back. */
export function getContactLinks(): Promise<Tagged<ContactLinks>> {
  return http.getWithETag({
    path: "/contacts/links",
    schema: contactLinksSchema,
  });
}
