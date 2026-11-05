import { queryOptions } from "@tanstack/react-query";

import { getContactLinks } from "./getContactLinks";

/** The contact links with their ETag. A save puts the saved links here. */
export const contactLinksQuery = queryOptions({
  queryFn: () => getContactLinks(),
  queryKey: ["contacts", "links"],
});
