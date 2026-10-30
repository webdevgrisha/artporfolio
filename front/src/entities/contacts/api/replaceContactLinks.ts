import { http } from "@/shared/api/http";

import { type ContactLinks, contactLinksResponseSchema } from "../model/contactLinks";

interface ReplaceContactLinksParams {
  links: ContactLinks;
}

/** Replaces all links and returns the values saved by the server (trimmed). */
export async function replaceContactLinks({
  links,
}: ReplaceContactLinksParams): Promise<ContactLinks> {
  const response = await http.put({
    path: "/contacts/links",
    body: links,
    schema: contactLinksResponseSchema,
  });

  return response.links;
}
